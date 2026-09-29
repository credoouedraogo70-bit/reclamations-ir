import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateUserDto, UpdateUserDto, ResetPasswordDto, ListUsersQueryDto } from './dto';
import * as bcrypt from 'bcrypt';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query() query: ListUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async create(@Body() data: CreateUserDto) {
    const mot_de_passe_hash = await bcrypt.hash(data.password, 10);
    return this.usersService.create({
      nom: data.nom,
      email: data.email,
      mot_de_passe_hash,
      role: data.role,
    });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdateUserDto, @Req() req: any) {
    const isAdmin = req.user.role === 'ADMIN';
    const isSelf = req.user.sub === +id;

    if (!isAdmin) {
      if (!isSelf) {
        throw new ForbiddenException('Vous ne pouvez modifier que votre propre profil.');
      }
      if (data.role !== undefined || data.statut !== undefined) {
        throw new ForbiddenException('Seul un administrateur peut modifier le rôle ou le statut.');
      }
    }

    return this.usersService.update(+id, data);
  }

  @Patch(':id/password')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async resetPassword(@Param('id') id: string, @Body() data: ResetPasswordDto) {
    const mot_de_passe_hash = await bcrypt.hash(data.password, 10);
    return this.usersService.resetPassword(+id, mot_de_passe_hash);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
