import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getMetrics(workspaceId: string, range = '7d') {
    const now = new Date();
    const activeDays = range === '30d' ? 30 : 7;
    const activeStart = new Date(now.getTime() - activeDays * 24 * 60 * 60 * 1000);
    const previousStart = new Date(activeStart.getTime() - activeDays * 24 * 60 * 60 * 1000);

    // 1. Conversations Count & Delta
    const activeConvos = await this.prisma.conversation.count({
      where: {
        workspaceId,
        startedAt: { gte: activeStart, lte: now },
      },
    });

    const previousConvos = await this.prisma.conversation.count({
      where: {
        workspaceId,
        startedAt: { gte: previousStart, lt: activeStart },
      },
    });

    const convosDelta = previousConvos === 0 
      ? (activeConvos > 0 ? 100 : 0)
      : Math.round(((activeConvos - previousConvos) / previousConvos) * 100);

    const convoDailyCounts = await this.getDailyCounts(
      workspaceId,
      'conversation',
      activeStart,
      now,
      activeDays,
    );
    const convoSpark = this.generateSparklinePoints(convoDailyCounts);

    // 2. Leads Captured Count & Delta
    const activeLeads = await this.prisma.lead.count({
      where: {
        workspaceId,
        createdAt: { gte: activeStart, lte: now },
      },
    });

    const previousLeads = await this.prisma.lead.count({
      where: {
        workspaceId,
        createdAt: { gte: previousStart, lt: activeStart },
      },
    });

    const leadsDelta = previousLeads === 0
      ? (activeLeads > 0 ? 100 : 0)
      : Math.round(((activeLeads - previousLeads) / previousLeads) * 100);

    const leadDailyCounts = await this.getDailyCounts(
      workspaceId,
      'lead',
      activeStart,
      now,
      activeDays,
    );
    const leadSpark = this.generateSparklinePoints(leadDailyCounts);

    // 3. Hot Leads Count & Delta
    const activeHotLeads = await this.prisma.lead.count({
      where: {
        workspaceId,
        score: 'Hot',
        createdAt: { gte: activeStart, lte: now },
      },
    });

    const previousHotLeads = await this.prisma.lead.count({
      where: {
        workspaceId,
        score: 'Hot',
        createdAt: { gte: previousStart, lt: activeStart },
      },
    });

    const hotLeadsDelta = activeHotLeads - previousHotLeads;

    const hotDailyCounts = await this.getDailyCounts(
      workspaceId,
      'lead',
      activeStart,
      now,
      activeDays,
      { score: 'Hot' },
    );
    const hotSpark = this.generateSparklinePoints(hotDailyCounts);

    // 4. Opportunities
    const activeOpps = await this.prisma.lead.count({
      where: {
        workspaceId,
        status: 'New',
        createdAt: { gte: activeStart, lte: now },
      },
    });

    const oppsDailyCounts = await this.getDailyCounts(
      workspaceId,
      'lead',
      activeStart,
      now,
      activeDays,
      { status: 'New' },
    );
    const oppsSpark = this.generateSparklinePoints(oppsDailyCounts);

    // 5. Needs you (Hot leads)
    const hotLeadsList = await this.prisma.lead.findMany({
      where: {
        workspaceId,
        score: 'Hot',
      },
      orderBy: { createdAt: 'desc' },
    });

    const needsYou = hotLeadsList.map(lead => ({
      id: lead.id,
      score: lead.score as 'Hot' | 'Warm' | 'Cold',
      name: lead.name || 'Anonymous Lead',
      email: lead.email || 'No email provided',
      note: lead.aiNote || 'No explanation provided.',
      time: this.formatRelativeTime(lead.createdAt),
    }));

    // 6. Recent activity (Latest conversations)
    const recentConvos = await this.prisma.conversation.findMany({
      where: { workspaceId },
      orderBy: { startedAt: 'desc' },
      take: 5,
    });

    const recentActivity = recentConvos.map(c => ({
      id: c.id,
      visitor: c.visitorLabel || 'Visitor',
      time: this.formatRelativeTime(c.startedAt),
      messages: c.messageCount,
      captured: c.captured,
    }));

    return {
      conversations: {
        value: String(activeConvos),
        deltaPct: `${convosDelta >= 0 ? '▲' : '▼'} ${Math.abs(convosDelta)}%`,
        deltaTone: convosDelta >= 0 ? 'up' : 'flat',
        spark: convoSpark,
      },
      leadsCaptured: {
        value: String(activeLeads),
        deltaPct: `${leadsDelta >= 0 ? '▲' : '▼'} ${Math.abs(leadsDelta)}%`,
        deltaTone: leadsDelta >= 0 ? 'up' : 'flat',
        spark: leadSpark,
      },
      hotLeads: {
        value: String(activeHotLeads),
        deltaPct: `${hotLeadsDelta >= 0 ? '▲' : '▼'} ${Math.abs(hotLeadsDelta)} new`,
        deltaTone: hotLeadsDelta >= 0 ? 'up' : 'flat',
        spark: hotSpark,
      },
      opportunities: {
        value: String(activeOpps),
        deltaPct: 'unworked',
        deltaTone: 'flat',
        spark: oppsSpark,
      },
      needsYou,
      recentActivity,
    };
  }

  private async getDailyCounts(
    workspaceId: string,
    modelName: 'conversation' | 'lead',
    start: Date,
    end: Date,
    days: number,
    filter: any = {},
  ): Promise<number[]> {
    const records = await (this.prisma[modelName] as any).findMany({
      where: {
        workspaceId,
        createdAt: modelName === 'lead' ? { gte: start, lte: end } : undefined,
        startedAt: modelName === 'conversation' ? { gte: start, lte: end } : undefined,
        ...filter,
      },
      select: modelName === 'lead' ? { createdAt: true } : { startedAt: true },
    });

    const dailyCounts: number[] = Array(days).fill(0);
    const msInDay = 24 * 60 * 60 * 1000;

    for (const record of records) {
      const date = record.createdAt || record.startedAt;
      if (!date) continue;
      
      const diffMs = date.getTime() - start.getTime();
      const dayIndex = Math.floor(diffMs / msInDay);
      if (dayIndex >= 0 && dayIndex < days) {
        dailyCounts[dayIndex]++;
      }
    }

    return dailyCounts;
  }

  private generateSparklinePoints(counts: number[]): string {
    const N = counts.length;
    if (N <= 1) return '0,13 70,13';
    const max = Math.max(...counts);
    const points: string[] = [];
    for (let i = 0; i < N; i++) {
      const x = Math.round(i * (70 / (N - 1)));
      const y = max === 0 ? 20 : 22 - Math.round((counts[i] / max) * 18);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  }

  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
