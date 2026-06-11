import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';
import { GoogleGenAI, Modality } from '@google/genai';

@Injectable()
export class VoiceService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private llmService: LlmService,
  ) {}

  async createToken(workspaceId: string, agentId: string, resumptionHandle?: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, workspaceId },
    });
    if (!agent) {
      throw new NotFoundException(`Agent with ID ${agentId} not found`);
    }

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) {
      throw new NotFoundException(`Workspace not found`);
    }

    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    const voiceModel = this.configService.get<string>('VOICE_MODEL') || 'gemini-2.5-flash-native-audio-preview-09-2025';

    // Map user selected voice to Gemini's prebuilt voices
    let mappedVoice = 'Kore';
    const vName = (agent.voiceName || '').toLowerCase();
    if (vName === 'aria') mappedVoice = 'Aoede';
    else if (vName === 'ravi') mappedVoice = 'Charon';
    else if (vName === 'maya') mappedVoice = 'Kore';

    // Build the locked system instructions (no markdown, conversational length)
    const captureFields = Array.isArray(agent.captureFields)
      ? (agent.captureFields as string[])
      : ['name', 'email'];

    const composedSystemInstruction = `
You are ${agent.name}, a ${agent.persona || 'Friendly'} assistant for ${workspace.name}.
Your tone must be warm, empathetic, and direct. Since you are speaking over a phone call, keep your sentences brief, clear, and conversational.
Answer ONLY using the query_knowledge_base tool to search the knowledge base. If the search returns no information, explain that you don't have that info and offer to take their details so a team member can follow up. Never make up facts.
Goal: ${agent.goal || 'qualify'}. When the user shows interest, collect: ${captureFields.join(', ')}.
Keep responses concise (under 30 words per turn). No markdown formatting.
`.trim();

    // Define query_knowledge_base tool
    const tools = [
      {
        functionDeclarations: [
          {
            name: 'query_knowledge_base',
            description: "Query the company's knowledge base for policies, terms of service, shipping information, FAQs, and general customer guidelines.",
            parameters: {
              type: 'OBJECT' as any,
              properties: {
                query: { type: 'STRING' as any, description: "The customer's question or search query (e.g., 'refund timeline', 'shipping regions')" }
              },
              required: ['query']
            }
          }
        ]
      }
    ];

    const client = new GoogleGenAI({
      apiKey,
      httpOptions: { apiVersion: 'v1alpha' }
    });

    const now = Date.now();
    const expireTime = new Date(now + 30 * 60 * 1000).toISOString();
    const tokenResponse = await client.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        newSessionExpireTime: new Date(now + 60 * 1000).toISOString(),
        liveConnectConstraints: {
          model: voiceModel,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: mappedVoice
                }
              }
            },
            systemInstruction: {
              parts: [{ text: composedSystemInstruction }]
            },
            tools,
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            sessionResumption: resumptionHandle
              ? { handle: resumptionHandle }
              : {}
          }
        }
      }
    });

    return {
      token: tokenResponse.name,
      expireTime,
      model: voiceModel
    };
  }

  async finalize(
    workspaceId: string,
    body: {
      agentId: string;
      conversationId?: string;
      transcript: { role: string; content: string }[];
      visitorMeta?: any;
    },
  ) {
    const { agentId, conversationId, transcript, visitorMeta } = body;

    let convo: any = null;
    if (conversationId) {
      convo = await this.prisma.conversation.findFirst({
        where: { id: conversationId, workspaceId },
      });
    }

    if (!convo) {
      convo = await this.prisma.conversation.create({
        data: {
          workspaceId,
          agentId,
          channel: 'voice',
          visitorMeta: visitorMeta || {},
          startedAt: new Date(),
          endedAt: new Date(),
        },
      });
    } else {
      convo = await this.prisma.conversation.update({
        where: { id: convo.id },
        data: {
          endedAt: new Date(),
          ...(visitorMeta ? { visitorMeta } : {}),
        },
      });
    }

    for (const msg of transcript) {
      const dbRole = (msg.role === 'user' || msg.role === 'visitor') ? 'visitor' : 'agent';
      await this.prisma.message.create({
        data: {
          workspaceId,
          conversationId: convo.id,
          role: dbRole,
          content: msg.content,
        },
      });
    }

    const mappedHistory = transcript.map(msg => ({
      role: (msg.role === 'user' || msg.role === 'visitor') ? 'visitor' : 'agent',
      content: msg.content,
    }));

    const scoringResult = await this.llmService.scoreConversation(mappedHistory);

    let email = scoringResult.email;
    let phone = scoringResult.phone;
    let name = scoringResult.name;

    for (const msg of mappedHistory) {
      if (msg.role === 'visitor') {
        const regexEmail = msg.content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        const regexPhone = msg.content.match(/\+?[0-9]{1,4}?[-.\s]?\(?[0-9]{1,3}?\)?[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,9}/);
        if (!email && regexEmail) email = regexEmail[0];
        if (!phone && regexPhone) phone = regexPhone[0];
      }
    }

    const isCaptured = !!(email || phone || name);
    let finalScore = scoringResult.score || convo.score || 'Cold';
    if (isCaptured && finalScore === 'Cold') {
      finalScore = 'Warm';
    }

    let leadId: string | null = null;
    const capturedFieldsList: string[] = [];
    if (isCaptured) {
      let lead: any = null;
      if (email) {
        lead = await this.prisma.lead.findFirst({
          where: { workspaceId, email },
        });
      }
      if (!lead) {
        lead = await this.prisma.lead.findFirst({
          where: { workspaceId, conversationId: convo.id },
        });
      }

      const leadData: any = {
        workspaceId,
        conversationId: convo.id,
        score: finalScore,
        intent: scoringResult.intent || 'Interested in voice follow-up',
        aiNote: scoringResult.aiNote || 'Captured details from voice conversation',
        source: convo.channel,
      };

      if (email) leadData.email = email;
      if (phone) leadData.phone = phone;
      if (name) leadData.name = name;

      if (lead) {
        lead = await this.prisma.lead.update({
          where: { id: lead.id },
          data: leadData,
        });
      } else {
        lead = await this.prisma.lead.create({
          data: leadData,
        });
      }
      leadId = lead.id;
      if (lead.name) capturedFieldsList.push('name');
      if (lead.email) capturedFieldsList.push('email');
      if (lead.phone) capturedFieldsList.push('phone');
    }

    await this.prisma.conversation.update({
      where: { id: convo.id },
      data: {
        messageCount: convo.messageCount + transcript.length,
        captured: convo.captured || isCaptured,
        score: finalScore,
        visitorLabel: name || convo.visitorLabel || (email ? email.split('@')[0] : undefined),
      },
    });

    return {
      conversationId: convo.id,
      captured: isCaptured ? { fields: capturedFieldsList } : undefined,
      score: finalScore,
    };
  }
}
