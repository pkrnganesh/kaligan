import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AgentService {
  constructor(private prisma: PrismaService) {}

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
    });
    if (!agent) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }
    return agent;
  }

  async create(workspaceId: string, data: { kind: string; name: string; [key: string]: any }) {
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

  async publish(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id);
    return this.prisma.agent.update({
      where: { id },
      data: { status: 'live' },
    });
  }

  async delete(workspaceId: string, id: string) {
    await this.findOne(workspaceId, id);
    return this.prisma.agent.delete({
      where: { id },
    });
  }
}
