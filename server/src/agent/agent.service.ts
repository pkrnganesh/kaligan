import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BillingService } from '../billing/billing.service';

@Injectable()
export class AgentService {
  constructor(
    private prisma: PrismaService,
    private billingService: BillingService,
  ) {}

  async findMany(workspaceId: string, kind?: string) {
    return this.prisma.agent.findMany({
      where: {
        workspaceId,
        ...(kind ? { kind } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(workspaceId: string, id: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id, workspaceId },
      include: {
        phoneNumbers: true,
      },
    });
    if (!agent) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }
    return agent;
  }

  async create(workspaceId: string, data: { kind: string; name: string; [key: string]: any }) {
    const exceeded = await this.billingService.isLimitExceeded(workspaceId, 'agents');
    if (exceeded) {
      throw new HttpException(
        'Agent limit exceeded. Please upgrade your plan.',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    return this.prisma.agent.create({
      data: {
        workspaceId,
        kind: data.kind,
        name: data.name,
        persona: data.persona ?? 'Friendly',
        greeting: data.greeting ?? 'Hello! How can I help you today?',
        goal: data.goal ?? 'qualify',
        voiceName: data.voiceName,
        language: data.language ?? 'en-US',
        speakingSpeed: data.speakingSpeed ?? 'natural',
        channels: data.channels ?? { web: true, phone: false },
        captureFields: data.captureFields ?? ['name', 'email'],
        connectedKbDocumentIds: data.connectedKbDocumentIds ?? [],
        status: 'draft',
      },
    });
  }

  async update(workspaceId: string, id: string, data: any) {
    // Check existence first
    await this.findOne(workspaceId, id);

    // Filter out read-only fields
    const { id: _, workspaceId: __, createdAt: ___, updatedAt: ____, ...updateData } = data;

    return this.prisma.agent.update({
      where: { id },
      data: updateData,
    });
  }

  async publish(workspaceId: string, id: string, userId?: string) {
    const agent = await this.findOne(workspaceId, id);
    
    // Update status to live
    const updatedAgent = await this.prisma.agent.update({
      where: { id },
      data: { status: 'live' },
    });

    const configSnapshot = {
      name: agent.name,
      persona: agent.persona,
      greeting: agent.greeting,
      goal: agent.goal,
      voiceName: agent.voiceName,
      language: agent.language,
      speakingSpeed: agent.speakingSpeed,
      channels: agent.channels,
      captureFields: agent.captureFields,
      connectedKbDocumentIds: agent.connectedKbDocumentIds,
    };

    // Create configuration snapshot in AgentVersion
    await this.prisma.agentVersion.create({
      data: {
        agentId: id,
        workspaceId,
        configSnapshot,
        publishedBy: userId || null,
      },
    });

    return updatedAgent;
  }

  async getVersions(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id);
    return this.prisma.agentVersion.findMany({
      where: { agentId: id, workspaceId },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async rollback(workspaceId: string, id: string, versionId: string) {
    await this.findOne(workspaceId, id);
    
    const version = await this.prisma.agentVersion.findFirst({
      where: { id: versionId, agentId: id, workspaceId },
    });
    if (!version) {
      throw new NotFoundException(`Agent version with ID ${versionId} not found`);
    }

    const snapshot = version.configSnapshot as any;

    return this.prisma.agent.update({
      where: { id },
      data: {
        name: snapshot.name,
        persona: snapshot.persona,
        greeting: snapshot.greeting,
        goal: snapshot.goal,
        voiceName: snapshot.voiceName,
        language: snapshot.language,
        speakingSpeed: snapshot.speakingSpeed,
        channels: snapshot.channels,
        captureFields: snapshot.captureFields,
        connectedKbDocumentIds: snapshot.connectedKbDocumentIds,
      },
    });
  }

  async delete(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id);
    return this.prisma.agent.delete({
      where: { id },
    });
  }
}
