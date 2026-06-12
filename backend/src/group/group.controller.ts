import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { type GroupMember, type Group } from 'generated/prisma';
import { SocketGateway } from 'src/socket/socket.gateway';

@Controller('/api/group')
export class GroupController {
  constructor(
    private readonly groupService: GroupService,
    private readonly socketGateway: SocketGateway,
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  async create(@Req() req, @Body() createGroupDto: Group) {
    const response = await this.groupService.create(
      createGroupDto,
      req['user'],
    );
    this.socketGateway.server
      .to(`user:${response?.group?.userId}`)
      .emit('group:new', response.group);
    return response;
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(@Req() req, @Body() group: Group) {
    return this.groupService.findAll(group, req['user']);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupService.findOne(+id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGroupDto: UpdateGroupDto) {
    return this.groupService.update(id, updateGroupDto);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const response = await this.groupService.remove(id);
    if (response?.members) {
      const socket = this.socketGateway;
      response.members.forEach(function (member) {
        socket.server
          .to(`user:${member.userId}`)
          .emit('group:delete', member.groupId);
      });
    }
    return response;
  }

  @UseGuards(AuthGuard)
  @Post('member')
  async createMember(@Req() req, @Body() member: GroupMember) {
    const save = await this.groupService.createMember(member, req['user']);
    const savedMessage = save.savedMessage!;
    const payload = {
      id: savedMessage.id,
      tempId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      message: savedMessage.content,
      content: savedMessage.content,
      messageType: 'info',
      read: false,
      sent: true,
      delivered: false,
      from: savedMessage.sender,
      to: savedMessage.receiverId,
      timestamp: savedMessage.createdAt.toISOString(),
      replyTo: savedMessage.replyTo
        ? {
            id: savedMessage.replyTo.id,
            message: savedMessage.replyTo.content,
            from: {
              id: savedMessage.replyTo.sender.id,
              name: savedMessage.replyTo.sender.name,
            },
          }
        : null,
      reactions: savedMessage.reactions.map((reaction) => ({
        id: reaction.id,
        emoji: reaction.emoji,
        user: {
          id: reaction.user.id,
          name: reaction.user.name,
        },
      })),
    };
    const sock = this.socketGateway.server;
    if (save?.group?.members) {
      save?.group?.members.map(function (memb) {
        sock.to(`user:${memb.userId}`).emit('message:new', payload);
      });
    }

    this.socketGateway.server
      .to(`user:${member.userId}`)
      .emit('member:new', save.group);
    this.socketGateway.server
      .to(`user:${save.group?.userId}`)
      .emit('member:new', save.group);
    return save;
  }

  @UseGuards(AuthGuard)
  @Get('member/:groupId')
  findAllMembers(@Body() groupId: string) {
    return this.groupService.findAllMembers(groupId);
  }

  @UseGuards(AuthGuard)
  @Delete('member/:groupId/:id')
  async removeMember(
    @Req() req,
    @Param('groupId') groupId: string,
    @Param('id') id: string,
  ) {
    const saved = await this.groupService.removeMember(
      groupId,
      id,
      req['user'],
    );
    const savedMessage = saved.savedMessage!;

    const payload = {
      id: savedMessage.id,
      tempId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      message: savedMessage.content,
      content: savedMessage.content,
      messageType: 'info',
      read: false,
      sent: true,
      delivered: false,
      from: savedMessage.sender,
      to: savedMessage.receiverId,
      timestamp: savedMessage.createdAt.toISOString(),
      replyTo: savedMessage.replyTo
        ? {
            id: savedMessage.replyTo.id,
            message: savedMessage.replyTo.content,
            from: {
              id: savedMessage.replyTo.sender.id,
              name: savedMessage.replyTo.sender.name,
            },
          }
        : null,
      reactions: savedMessage.reactions.map((reaction) => ({
        id: reaction.id,
        emoji: reaction.emoji,
        user: {
          id: reaction.user.id,
          name: reaction.user.name,
        },
      })),
    };

    const sock = this.socketGateway.server;
    if (saved?.group?.members) {
      saved?.group?.members.map(function (memb) {
        sock.to(`user:${memb.userId}`).emit('message:new', payload);
      });
    }
    this.socketGateway.server.to(`user:${id}`).emit('member:delete', groupId);
    this.socketGateway.server
      .to(`user:${saved.group?.userId}`)
      .emit('member:remove', saved.group);
    return saved;
  }
}
