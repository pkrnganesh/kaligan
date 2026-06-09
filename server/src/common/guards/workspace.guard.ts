import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const workspaceId = request.user?.workspaceId || request.workspaceId || 'mock-workspace-id';
    
    if (!workspaceId) {
      throw new ForbiddenException('Workspace context not resolved');
    }
    
    request.workspaceId = workspaceId;
    return true;
  }
}
