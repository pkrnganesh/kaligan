import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AgentService } from './agent.service';
import { WorkspaceGuard } from '../common/guards/workspace.guard';
import { CurrentWorkspace } from '../common/decorators/current-workspace.decorator';

@Controller('agents')
@UseGuards(WorkspaceGuard)
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Get()
  async getAgents(
    @CurrentWorkspace() workspaceId: string,
    @Query('kind') kind?: string,
  ) {
    return this.agentService.findMany(workspaceId, kind);
  }

  @Post()
  async createAgent(
    @CurrentWorkspace() workspaceId: string,
    @Body() body: { kind: string; name: string; [key: string]: any },
  ) {
    return this.agentService.create(workspaceId, body);
  }

  @Get(':id')
  async getAgent(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.agentService.findOne(workspaceId, id);
  }

  @Patch(':id')
  async updateAgent(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.agentService.update(workspaceId, id, body);
  }

  @Post(':id/publish')
  async publishAgent(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.agentService.publish(workspaceId, id);
  }

  @Delete(':id')
  async deleteAgent(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.agentService.delete(workspaceId, id);
  }
}
