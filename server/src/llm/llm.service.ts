import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class LlmService implements OnModuleInit {
  private readonly logger = new Logger(LlmService.name);
  private ai: GoogleGenAI | null = null;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey || apiKey === 'local_placeholder') {
      this.logger.warn('GEMINI_API_KEY is not configured or is a placeholder.');
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey || '' });
  }

  private getClient(): GoogleGenAI {
    if (!this.ai) {
      const apiKey = this.configService.get<string>('GEMINI_API_KEY');
      this.ai = new GoogleGenAI({ apiKey: apiKey || '' });
    }
    return this.ai;
  }

  /**
   * Generates a grounded conversational reply based on workspace KB context and message history
   */
  async generateChatReply(
    agentName: string,
    persona: string,
    goal: string,
    captureFields: string[],
    workspaceName: string,
    context: string,
    history: { role: string; content: string }[],
    message: string,
  ): Promise<string> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey || apiKey === 'local_placeholder') {
      this.logger.warn('GEMINI_API_KEY is not configured. Falling back to local mock grounding.');
      return this.generateMockGroundedReply(message, context, agentName);
    }

    const client = this.getClient();
    const modelName = this.configService.get<string>('GEMINI_TEXT_MODEL') || 'gemini-2.0-flash';

    // Map history to Gemini's contents schema: { role: 'user' | 'model', parts: [{ text: string }] }
    const contents: any[] = history.map(h => ({
      role: h.role === 'visitor' ? 'user' : 'model',
      parts: [{ text: h.content }],
    }));

    // Append the current message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const systemInstruction = `
You are ${agentName}, a ${persona} assistant for ${workspaceName}.
Answer ONLY using the CONTEXT provided below. If the context does not contain the answer, say you don't have that information and offer to take the visitor's details so the team can follow up. NEVER invent facts, prices, policies, or features.
Goal: ${goal}. When the visitor shows interest, collect: ${captureFields.join(', ')}.
Keep replies concise and conversational. No markdown.

CONTEXT:
${context || 'No relevant information found.'}
`;

    try {
      const response = await client.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction,
          temperature: 0.1, // keep it strictly grounded
        },
      });

      return response.text?.trim() || "I'm sorry, I couldn't process your request.";
    } catch (err: any) {
      this.logger.error('Error generating chat reply from Gemini:', err.message);
      this.logger.warn('Falling back to local mock grounding due to API error.');
      return this.generateMockGroundedReply(message, context, agentName);
    }
  }

  /**
   * Classifies lead intent, assigns score category, and extracts profile attributes
   */
  async scoreConversation(
    history: { role: string; content: string }[],
  ): Promise<{
    score: 'Hot' | 'Warm' | 'Cold';
    intent: string;
    aiNote: string;
    name?: string;
    email?: string;
    phone?: string;
  }> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey || apiKey === 'local_placeholder') {
      return this.scoreMockConversation(history);
    }

    const client = this.getClient();
    const modelName = this.configService.get<string>('GEMINI_TEXT_MODEL') || 'gemini-2.0-flash';

    const transcript = history
      .map(h => `${h.role === 'visitor' ? 'Visitor' : 'AI'}: ${h.content}`)
      .join('\n');

    const prompt = `
Analyze the following conversation transcript.
Determine:
1. The lead's qualification score: 'Hot', 'Warm', or 'Cold'.
   - Hot: Strong buying intent, asked for demo, pricing, or provided contact details for follow-up.
   - Warm: Interested but has basic questions, no immediate follow-up request yet.
   - Cold: Just browsing, casual greetings, or expressing lack of interest.
2. A summary of their intent (e.g. "Interested in pricing and demo").
3. A brief one-sentence note explaining why the score was assigned.
4. Extract profile fields if the visitor provided them in the transcript:
   - name (visitor's full name, if mentioned)
   - email (visitor's email address)
   - phone (visitor's phone number)

Return a JSON object matching this schema:
{
  "score": "Hot" | "Warm" | "Cold",
  "intent": "string detailing the visitor's intent",
  "aiNote": "brief sentence explaining the score",
  "name": "extracted name or null",
  "email": "extracted email or null",
  "phone": "extracted phone or null"
}

TRANSCRIPT:
${transcript}
`;

    try {
      const response = await client.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const responseText = response.text || '{}';
      const result = JSON.parse(responseText);

      return {
        score: result.score || 'Cold',
        intent: result.intent || 'Casual browsing',
        aiNote: result.aiNote || 'No specific buying intent shown.',
        name: result.name || undefined,
        email: result.email || undefined,
        phone: result.phone || undefined,
      };
    } catch (err: any) {
      this.logger.error('Error scoring conversation from Gemini:', err.message);
      this.logger.warn('Falling back to local mock scoring.');
      return this.scoreMockConversation(history);
    }
  }

  /**
   * Helper mock grounded answer generator
   */
  private generateMockGroundedReply(message: string, context: string, agentName: string): string {
    const cleanContext = (context || '').replace(/No relevant information found./i, '').trim();
    
    if (!cleanContext) {
      return `I don't have that information in my knowledge base. Could you please provide your email or phone number so our team can follow up with you?`;
    }

    // Split context into paragraphs/blocks
    const blocks = cleanContext
      .split(/\n\n+/)
      .map(b => b.trim())
      .filter(b => b.length > 0);

    const stopWords = new Set([
      'what', 'who', 'where', 'when', 'why', 'how', 'is', 'are', 'was', 'were', 'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'from', 'up', 'down', 'in', 'out', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now',
      'kaligan', 'ai', 'company', 'information', 'document', 'overview'
    ]);

    // Tokenize query message into words
    const queryWords = message
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));

    // Common prefix helper for simple stemming
    const commonPrefixLen = (a: string, b: string): number => {
      let len = 0;
      while (len < a.length && len < b.length && a[len] === b[len]) {
        len++;
      }
      return len;
    };

    let bestBlock = '';
    let maxScore = 0;

    for (const block of blocks) {
      const lowerBlock = block.toLowerCase().replace(/[^\w\s]/g, '');
      const blockWords = lowerBlock.split(/\s+/);
      
      let score = 0;
      for (const qWord of queryWords) {
        for (const bWord of blockWords) {
          if (bWord === qWord) {
            score += 10; // Exact match
          } else {
            // Check prefix overlap (stemming)
            const prefixLen = commonPrefixLen(bWord, qWord);
            if (prefixLen >= 4) {
              score += 5;
            }
          }
        }
      }

      if (score > maxScore) {
        maxScore = score;
        bestBlock = block;
      }
    }

    if (maxScore > 0 && bestBlock) {
      return `${bestBlock}\n\nLet me know if you need more details!`;
    }

    // Fallback: If no query words matched, return the first block
    return `${blocks[0]}\n\nLet me know if that helps!`;
  }

  /**
   * Helper mock intent scorer
   */
  private scoreMockConversation(
    history: { role: string; content: string }[],
  ): {
    score: 'Hot' | 'Warm' | 'Cold';
    intent: string;
    aiNote: string;
    name?: string;
    email?: string;
    phone?: string;
  } {
    let email: string | undefined;
    let phone: string | undefined;
    let name: string | undefined;

    // Scan messages
    for (const msg of history) {
      if (msg.role === 'visitor') {
        const text = msg.content;
        
        // Extract email
        const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) email = emailMatch[0];

        // Extract phone
        const phoneMatch = text.match(/\+?[0-9]{1,4}?[-.\s]?\(?[0-9]{1,3}?\)?[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,9}/);
        if (phoneMatch) phone = phoneMatch[0];

        // Extract name
        const nameMatch = text.match(/my name is ([a-zA-Z ]{2,30})/i) || text.match(/i am ([a-zA-Z ]{2,30})/i);
        if (nameMatch) name = nameMatch[1].trim();
      }
    }

    const hasContact = !!(email || phone);
    const mentionsQualifiers = history.some(m => 
      m.role === 'visitor' && 
      /price|trial|cost|demo|buy|sign up|agency/i.test(m.content)
    );

    let score: 'Hot' | 'Warm' | 'Cold' = 'Cold';
    let intent = 'Browsing / Saying hello';
    let aiNote = 'Visitor did not ask purchase queries or leave contact details.';

    if (hasContact) {
      score = 'Hot';
      intent = 'Requested direct contact / follow-up';
      aiNote = `Provided contact information (${email || phone}).`;
    } else if (mentionsQualifiers) {
      score = 'Warm';
      intent = 'Inquiring about pricing or trial features';
      aiNote = 'Asked product interest questions, but has not provided details yet.';
    }

    return {
      score,
      intent,
      aiNote,
      name,
      email,
      phone,
    };
  }
}
