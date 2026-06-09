import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as argon2 from 'argon2';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async generateTokens(userId: string, workspaceId: string, role: string) {
    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const accessTtl = this.configService.get<number>('ACCESS_TTL', 900);
    const refreshTtl = this.configService.get<number>('REFRESH_TTL', 2592000);

    const payload = { sub: userId, workspaceId, role };
    const accessToken = this.jwtService.sign(payload, {
      secret: accessSecret,
      expiresIn: `${accessTtl}s`,
    });

    const refreshPayload = { sub: userId, jti: randomBytes(16).toString('hex') };
    const rawRefreshToken = this.jwtService.sign(refreshPayload, {
      secret: refreshSecret,
      expiresIn: `${refreshTtl}s`,
    });

    const refreshTokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + refreshTtl * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: refreshTokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  async signup(dto: SignupDto) {
    const email = dto.email.toLowerCase();

    // Check if email already registered
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email address is already registered');
    }

    // Generate workspace public key: 'ws_' + 24 hex chars
    const publicKey = `ws_${randomBytes(12).toString('hex')}`;

    // Hashes password
    const passwordHash = await argon2.hash(dto.password);

    // Create Workspace and User in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: dto.companyName,
          websiteUrl: dto.websiteUrl,
          publicKey,
        },
      });

      const user = await tx.user.create({
        data: {
          workspaceId: workspace.id,
          email,
          passwordHash,
          role: 'owner',
        },
      });

      return { workspace, user };
    });

    const tokens = await this.generateTokens(result.user.id, result.workspace.id, result.user.role);

    return {
      ...tokens,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
      workspace: {
        id: result.workspace.id,
        name: result.workspace.name,
        publicKey: result.workspace.publicKey,
      },
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { workspace: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user.id, user.workspaceId, user.role);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      workspace: {
        id: user.workspace.id,
        name: user.workspace.name,
        publicKey: user.workspace.publicKey,
      },
    };
  }

  async refresh(refreshToken: string) {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, { secret: refreshSecret });
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokenHash = this.hashToken(refreshToken);
    const tokenRecord = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    // Refresh token rotation: delete / revoke old token
    await this.prisma.refreshToken.delete({
      where: { id: tokenRecord.id },
    });

    // Generate new tokens
    return this.generateTokens(tokenRecord.userId, tokenRecord.user.workspaceId, tokenRecord.user.role);
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    // Delete the token hash from the DB
    await this.prisma.refreshToken.deleteMany({
      where: { tokenHash },
    });
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always log the link in dev console, but silently return to prevent email enumeration
    if (user) {
      const resetLink = `http://localhost:3000/reset-password?userId=${user.id}`;
      console.log(`[DEV ONLY] Forgot Password reset link: ${resetLink}`);
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const currentMatches = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!currentMatches) {
      throw new BadRequestException('Current password is incorrect');
    }

    const passwordHash = await argon2.hash(dto.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      workspace: {
        id: user.workspace.id,
        name: user.workspace.name,
        publicKey: user.workspace.publicKey,
      },
    };
  }

  async updateMe(userId: string, data: { name?: string; email?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.email !== undefined ? { email: data.email.toLowerCase() } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  }
}
