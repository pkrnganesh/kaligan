import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const secret = configService.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not configured in the environment');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: { sub: string; workspaceId: string; role: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, workspaceId: true, role: true },
    });
    if (!user) {
      throw new UnauthorizedException('User no longer exists or session is invalid');
    }
    return {
      userId: user.id,
      workspaceId: user.workspaceId,
      role: user.role,
    };
  }
}
