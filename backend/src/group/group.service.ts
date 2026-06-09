import { Injectable } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { PrismaService } from 'src/prisma.service';
import { GroupMember, type Group, type User } from 'generated/prisma';
import { serializeBigInt } from 'src/lib/utils';
import { Prisma } from '@prisma/client';

@Injectable()
export class GroupService {
  constructor(private prisma: PrismaService) {}
  async create(input: Group, user: User) {
    try {
      const group = await this.prisma.group.create({
        data: {
          name: input.name,
          userId: user.id,
          workSpaceId: user.workSpaceId,
          members: {
            create: {
              userId: user.id,
            },
          },
        },
      });
      if (group) {
        await this.prisma.message.create({
          data: {
            senderId: user.id,
            receiverId: group.id,
            content: `${user.name} created this channel`,
            tempId: `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            messageType: 'info',
          },
        });
        return {
          success: true,
          message: 'Channel created successfully',
          group: group,
        };
      }
      return {
        success: false,
        message: 'Something went wrong',
      };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        return {
          success: false,
          message: 'A channel with this name already exists.',
        };
      }

      console.error(e);

      return {
        success: false,
        message: e instanceof Error ? e.message : 'Something went wrong',
      };
    }
  }

  async findAll(input: Group, user) {
    const groups = await this.prisma.group.findMany({
      where: {
        ...input,
        members: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        members: true,
      },
      orderBy: {
        id: 'desc',
      },
    });
    if (!groups) {
      return {
        success: false,
      };
    }
    return {
      success: true,
      groups: serializeBigInt(groups),
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} group`;
  }

  async update(id: string, updateGroupDto: UpdateGroupDto) {
    const update = await this.prisma.group.update({
      where: { id: id },
      data: updateGroupDto,
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

  async remove(id: string) {
    const prisma = this.prisma;
    const messages = await prisma.message.findMany({
      where: { receiverId: id },
    });
    const members = await prisma.groupMember.findMany({
      where: { groupId: id },
    });
    if (messages) {
      messages.forEach(function (msg) {
        prisma.attachment.deleteMany({ where: { messageId: msg.id } });
        prisma.message.delete({ where: { id: msg.id } });
      });
    }
    await this.prisma.groupMember.deleteMany({ where: { groupId: id } });
    await this.prisma.group.delete({ where: { id: id } });
    return { success: true, message: 'Channel removed successfully',members:members };
  }

  async createMember(input: GroupMember, user: User) {
    try {
      const groupMember = await this.prisma.groupMember.create({
        data: {
          userId: input.userId,
          groupId: input.groupId,
        },
      });
      if (groupMember) {
        const member = await this.prisma.user.findFirst({
          where: { id: input.userId },
        });
        const message = await this.prisma.message.create({
          data: {
            senderId: user.id,
            receiverId: input.groupId,
            content: `${user.name} added ${member?.name}`,
            tempId: `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            messageType: 'info',
          },
          include: {
            sender: { select: { id: true, name: true } },
            replyTo: {
              select: {
                id: true,
                content: true,
                sender: { select: { id: true, name: true } },
              },
            },
            reactions: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
          },
        });
        return {
          success: true,
          message: `${member?.name} added to channel`,
          groupMember: groupMember,
          savedMessage: message,
        };
      }
      return {
        success: false,
        message: 'Something went wrong',
      };
    } catch (e) {
      return {
        success: false,
        message: e instanceof Error ? e.message : 'Something went wrong',
      };
    }
  }

  async removeMember(groupId: string, id: string, user: User) {
    const member = await this.prisma.user.findFirst({
      where: { id },
    });
    const message = await this.prisma.message.create({
      data: {
        senderId: user.id,
        receiverId: groupId,
        content: `${user.name} removed ${member?.name}`,
        tempId: `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        messageType: 'info',
      },
      include: {
        sender: { select: { id: true, name: true } },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: { select: { id: true, name: true } },
          },
        },
        reactions: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });
    await this.prisma.groupMember.deleteMany({
      where: { userId: id, groupId: groupId },
    });
    return {
      success: true,
      message: `${member?.name} removed successfully`,
      savedMessage: message,
    };
  }
}
