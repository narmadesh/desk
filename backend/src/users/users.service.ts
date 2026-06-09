import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma.service';
import { User } from 'generated/prisma';
import { serializeBigInt } from 'src/lib/utils';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  async findAll(input: User) {
    const users = await this.prisma.user.findMany({
      where: input,
    });
    if (!users) {
      return {
        success: false,
      };
    }
    return {
      success: true,
      users: serializeBigInt(users),
    };
  }

  async findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const update = await this.prisma.user.update({
      where: { id: id },
      data: updateUserDto,
    });
    if (!update) {
      return {
        success: false,
        message: 'Something went wrong',
      };
    }
    return {
      success: true,
    };
  }

  async remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
