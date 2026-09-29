import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
    private config: ConfigService,
  ) {}

  async signIn(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isMatch = await bcrypt.compare(pass, user.mot_de_passe_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        role: user.role
      }
    };
  }

  /**
   * Always responds the same way whether or not the email exists (or belongs to an
   * agent) — self-service reset is admin-only by policy, but that restriction stays
   * invisible to the caller so this endpoint can't be used to fish for which
   * addresses have an account, or for which ones are admins.
   */
  async forgotPassword(email: string) {
    const existing = await this.usersService.findOne(email);

    if (existing?.role === 'ADMIN') {
      const token = randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      const user = await this.usersService.setResetToken(email, token, expires);

      if (user) {
        const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
        const resetLink = `${frontendUrl}/reset-password?token=${token}`;
        await this.mailService.send(
          user.email,
          'Réinitialisation de votre mot de passe',
          `Bonjour ${user.nom},\n\nVous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous pour en choisir un nouveau (valable 1 heure) :\n\n${resetLink}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.\n\nCordialement,\nL'équipe Moov Africa`,
        );
      }
    }

    return { message: 'Si un compte existe avec cet email, un lien de réinitialisation vient de lui être envoyé.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService.findByValidResetToken(token);
    if (!user) throw new BadRequestException('Ce lien de réinitialisation est invalide ou a expiré.');

    const hash = await bcrypt.hash(newPassword, 10);
    await this.usersService.consumeResetToken(user.id, hash);
    return { success: true };
  }
}
