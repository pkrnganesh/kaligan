import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';

@Injectable()
export class PublicKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const publicKey = request.query?.workspacePublicKey || request.body?.workspacePublicKey;
    
    if (!publicKey) {
      throw new BadRequestException('workspacePublicKey is required');
    }
    
    request.workspaceId = `resolved-workspace-for-${publicKey}`;
    return true;
  }
}
