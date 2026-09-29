import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import { ListUsersQueryDto } from './dto';

function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}

const SAFE_USER_SELECT = {
  id: true,
  nom: true,
  email: true,
  role: true,
  statut: true,
  created_at: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: Prisma.UserCreateInput) {
    try {
      return await this.prisma.user.create({
        data,
        select: SAFE_USER_SELECT,
      });
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        throw new ConflictException('Un utilisateur avec cet email existe déjà.');
      }
      throw err;
    }
  }

  async findAll(query: ListUsersQueryDto = {}) {
    const where: Prisma.UserWhereInput = query.search
      ? { OR: [{ nom: { contains: query.search } }, { email: { contains: query.search } }] }
      : {};

    if (!query.page) {
      return this.prisma.user.findMany({ where, select: SAFE_USER_SELECT, orderBy: { nom: 'asc' } });
    }

    const page = query.page;
    const limit = query.limit ?? 10;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: SAFE_USER_SELECT,
        orderBy: { nom: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async update(id: number, data: Partial<Pick<User, 'nom' | 'email' | 'role' | 'statut'>>) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data,
        select: SAFE_USER_SELECT,
      });
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        throw new ConflictException('Un utilisateur avec cet email existe déjà.');
      }
      throw err;
    }
  }

  async remove(id: number) {
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }

  async resetPassword(id: number, mot_de_passe_hash: string) {
    await this.prisma.user.update({ where: { id }, data: { mot_de_passe_hash } });
    return { success: true };
  }

  async setResetToken(email: string, token: string, expires: Date) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    await this.prisma.user.update({
      where: { id: user.id },
      data: { reset_token: token, reset_token_expires: expires },
    });
    return user;
  }

  async findByValidResetToken(token: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { reset_token: token } });
    if (!user || !user.reset_token_expires || user.reset_token_expires < new Date()) return null;
    return user;
  }

  async consumeResetToken(id: number, mot_de_passe_hash: string) {
    await this.prisma.user.update({
      where: { id },
      data: { mot_de_passe_hash, reset_token: null, reset_token_expires: null },
    });
    return { success: true };
  }
}
