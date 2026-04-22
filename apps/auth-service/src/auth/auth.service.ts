import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { prisma } from '@edtech/db';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { StringValue } from 'ms';
import { JwtPayload } from '../types/jwt-payload';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  /** Check credentials — used by LocalStrategy */
  async validateUser(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { password: true },
    });

    if (!user || !user.password) return null;

    const isValid = await bcrypt.compare(password, user.password.passwordHash);
    if (!isValid) return null;

    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  /** Register a new user */
  async register(dto: RegisterDto) {
    const existing = await prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: { create: { passwordHash } },
      },
    });

    return this.generateTokens({ id: user.id, email: user.email, role: user.role });
  }

  /** Login — called after LocalStrategy */
  async login(user: { id: string; email: string; role: string }) {
    return this.generateTokens(user);
  }

  /** Token rotation */
  async refresh(userId: string, oldRefreshToken: string) {
    const tokenHash = this.hashToken(oldRefreshToken);

    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.userId !== userId || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Delete the old token (rotation)
    await prisma.refreshToken.delete({ where: { tokenHash } });

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return this.generateTokens({ id: user.id, email: user.email, role: user.role });
  }

  /** Logout — invalidate refresh token */
  async logout(refreshToken: string) {
    try {
      // Verify JWT to extract payload
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
      const tokenHash = this.hashToken(refreshToken);
      await prisma.refreshToken.deleteMany({
        where: { tokenHash, userId: payload.sub },
      });
    } catch {
      // If the token is invalid — just ignore it
    }
  }

  /** Generate token pair and store refresh token in DB */
  private async generateTokens(user: { id: string; email: string; role: string }) {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('jwt.accessSecret'),
      expiresIn: this.config.get<StringValue>('jwt.accessExpiresIn'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('jwt.refreshSecret'),
      expiresIn: this.config.get<StringValue>('jwt.refreshExpiresIn'),
    });

    // Save hash in DB for possible invalidation
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.refreshToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    return { accessToken, refreshToken, user };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
