import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Header,
  HttpCode,
  HttpStatus,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceGuard } from '../common/guards/workspace.guard';
import { CurrentWorkspace } from '../common/decorators/current-workspace.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Request } from 'express';
import { randomBytes } from 'crypto';

@Controller('telephony')
export class TelephonyController {
  constructor(private prisma: PrismaService) {}

  @Post('numbers/connect')
  @UseGuards(WorkspaceGuard)
  async connectNumber(
    @CurrentWorkspace() workspaceId: string,
    @Body() body: { agentId: string; phoneE164: string },
  ) {
    const { agentId, phoneE164 } = body;
    if (!agentId || !phoneE164) {
      throw new BadRequestException('agentId and phoneE164 are required');
    }

    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, workspaceId },
    });
    if (!agent) {
      throw new BadRequestException('Invalid agent ID for this workspace');
    }

    // Generate ephemeral token for Twilio webhook route authentication
    const agentToken = randomBytes(16).toString('hex');

    // Create or update connection
    const connection = await this.prisma.phoneNumber.upsert({
      where: { agentToken },
      update: {
        agentId,
        e164: phoneE164,
        status: 'pending',
      },
      create: {
        workspaceId,
        agentId,
        e164: phoneE164,
        agentToken,
        status: 'pending',
      },
    });

    return {
      connectionId: connection.id,
      agentToken,
      webhookUrl: `/api/v1/telephony/twilio/incoming/${agentToken}`,
      instructions: `Point your Twilio incoming Voice webhook URL to: /api/v1/telephony/twilio/incoming/${agentToken}`,
    };
  }

  @Post('numbers/verify')
  @UseGuards(WorkspaceGuard)
  async verifyNumber(
    @CurrentWorkspace() workspaceId: string,
    @Body() body: { agentToken: string },
  ) {
    const { agentToken } = body;
    if (!agentToken) {
      throw new BadRequestException('agentToken is required');
    }

    const connection = await this.prisma.phoneNumber.findFirst({
      where: { agentToken, workspaceId },
    });

    if (!connection) {
      throw new BadRequestException('Telephony connection not found');
    }

    // Verification check: if it is pending, set it to connected to simulate success
    const updated = await this.prisma.phoneNumber.update({
      where: { id: connection.id },
      data: { status: 'connected', connectedAt: new Date() },
    });

    return {
      status: updated.status,
      connectedAt: updated.connectedAt,
    };
  }

  @Get('calls')
  @UseGuards(WorkspaceGuard)
  async getCalls(@CurrentWorkspace() workspaceId: string) {
    const calls = await this.prisma.call.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    const callsWithConvo = await Promise.all(
      calls.map(async (call) => {
        const convo = await this.prisma.conversation.findFirst({
          where: { callSid: call.callSid, workspaceId },
          include: {
            messages: { orderBy: { createdAt: 'asc' } },
            leads: { take: 1 },
          },
        });
        return {
          ...call,
          conversation: convo
            ? {
                id: convo.id,
                captured: convo.captured,
                score: convo.score,
                messages: convo.messages,
                lead: convo.leads[0] || null,
              }
            : null,
        };
      }),
    );

    return callsWithConvo;
  }

  @Post('twilio/incoming/:agentToken')
  @Public()
  @Header('Content-Type', 'text/xml')
  @HttpCode(HttpStatus.OK)
  async handleIncomingCall(
    @Param('agentToken') agentToken: string,
    @Req() req: any,
  ) {
    const connection = await this.prisma.phoneNumber.findFirst({
      where: { agentToken },
    });

    if (!connection) {
      return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Invalid voice token configuration. Goodbye.</Say>
  <Reject />
</Response>`;
    }

    // Determine host & protocol for Twilio WebSocket Stream pointing back to MediaBridgeGateway
    const host = req.headers.host || 'localhost:3005';
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    const protocol = isSecure ? 'wss' : 'ws';
    
    // Construct local or public stream url (port 3005 is standard dev NestJS server)
    const streamUrl = `${protocol}://${host}/telephony/twilio/incoming/${agentToken}`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Connecting you to our AI receptionist.</Say>
  <Connect>
    <Stream url="${streamUrl}" />
  </Connect>
</Response>`;
  }
}
