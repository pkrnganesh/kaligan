import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.workspaceId) {
      throw new ForbiddenException('User context missing workspace context');
    }

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: user.workspaceId },
      select: { id: true },
    });

    if (!workspace) {
      throw new ForbiddenException('Invalid workspace configuration');
    }

    request.workspaceId = workspace.id;
    return true;
  }
}
