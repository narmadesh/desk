import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { AuthGuard } from 'src/auth/auth.guard';
import { PrismaService } from 'src/prisma.service';
import { type AuthenticatedSocket } from './types/socket.type';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}
  @WebSocketServer()
  server!: Server;

  async handleConnection(client: AuthenticatedSocket) {
    const token = client.handshake.auth.token;
    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      client.user = payload;
      const userId = client.user?.id;
      const workspaceId = client.user?.workSpace?.id;
      client.join(`user:${userId}`);
      client.join(`workspace:${workspaceId}`);
      if (userId) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { online: true },
        });
      }
      this.server.to(`workspace:${workspaceId}`).emit('user:online', userId);
    } catch (err) {
      console.log(err);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.user?.id;
    const workspaceId = client.user?.workSpace?.id;
    if (userId) {
      try {
        await this.prisma.user.update({
          where: { id: userId },
          data: { online: false },
        });
      } catch (e) {}
    }
    this.server.to(`workspace:${workspaceId}`).emit('user:offline', userId);
  }

  @SubscribeMessage('message:count')
  async handleMessageCount(@ConnectedSocket() client: AuthenticatedSocket) {
    const userId = client.user?.id;
    const count = await this.prisma.message.findMany({
      where: { receiverId: userId, read: false },
    });
    const countMessage = {};
    if (count) {
      count.map((msg) => {
        countMessage[msg.senderId] = countMessage[msg.senderId]
          ? countMessage[msg.senderId] + 1
          : 1;
      });
    }
    this.server.to(`user:${userId}`).emit('message:count', countMessage);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() otherUserId: string,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const userId = client.user?.id;
    this.server.to(`user:${otherUserId}`).emit('typing', userId);
  }

  @SubscribeMessage('stop_typing')
  handleStopTyping(
    @MessageBody() otherUserId: string,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const userId = client.user?.id;
    this.server.to(`user:${otherUserId}`).emit('stop_typing', userId);
  }

  @SubscribeMessage('message:send')
  async handleMessage(
    @MessageBody() data: any,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const userId = client.user?.id;
    const recipientId = data?.to;
    const messageContent = data?.message;
    const replyToId = data?.replyToId;
    const tempId = data?.tempId;

    if (!userId || !recipientId || !messageContent) {
      return;
    }

    try {
      const createdMessage = await this.prisma.message.create({
        data: {
          senderId: userId,
          receiverId: recipientId,
          content: messageContent,
          replyToId,
          tempId,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
            },
          },
          replyTo: {
            select: {
              id: true,
              content: true,
              sender: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      const group = await this.prisma.group.findFirst({
        where: { id: recipientId },
        include: { members: true },
      });
      const sock = this.server;
      if (group) {
        const payload = {
          id: createdMessage.id,
          tempId,
          message: createdMessage.content,
          content: createdMessage.content,
          read: false,
          sent: true,
          delivered: false,
          from: createdMessage.sender,
          to: createdMessage.receiverId,
          timestamp: createdMessage.createdAt.toISOString(),
          replyTo: createdMessage.replyTo
            ? {
                id: createdMessage.replyTo.id,
                message: createdMessage.replyTo.content,
                from: {
                  id: createdMessage.replyTo.sender.id,
                  name: createdMessage.replyTo.sender.name,
                },
              }
            : null,
          reactions: createdMessage.reactions.map((reaction) => ({
            id: reaction.id,
            emoji: reaction.emoji,
            user: {
              id: reaction.user.id,
              name: reaction.user.name,
            },
          })),
        };
        group.members.forEach(function (member) {
          sock.to(`user:${member.userId}`).emit('message:new', payload);
        });
        this.server.to(`user:${recipientId}`).emit('message:new', payload);
      } else {
        const payload = {
          id: createdMessage.id,
          tempId,
          message: createdMessage.content,
          content: createdMessage.content,
          read: false,
          sent: true,
          delivered: false,
          from: createdMessage.sender,
          to: createdMessage.receiverId,
          timestamp: createdMessage.createdAt.toISOString(),
          replyTo: createdMessage.replyTo
            ? {
                id: createdMessage.replyTo.id,
                message: createdMessage.replyTo.content,
                from: {
                  id: createdMessage.replyTo.sender.id,
                  name: createdMessage.replyTo.sender.name,
                },
              }
            : null,
          reactions: createdMessage.reactions.map((reaction) => ({
            id: reaction.id,
            emoji: reaction.emoji,
            user: {
              id: reaction.user.id,
              name: reaction.user.name,
            },
          })),
        };
        this.server.to(`user:${recipientId}`).emit('message:new', payload);
        this.server.to(`user:${userId}`).emit('message:new', payload);
      }
    } catch (e) {}
  }

  @SubscribeMessage('message:reaction')
  async handleReaction(
    @MessageBody() data: any,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const userId = client.user?.id;
    const { messageId, emoji, to } = data;

    if (!userId || !messageId || !emoji || !to) {
      return;
    }

    const reaction = await this.prisma.messageReaction.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
      update: { emoji },
      create: {
        messageId,
        userId,
        emoji,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const payload = {
      messageId,
      reactions:
        message?.reactions.map((reaction) => ({
          id: reaction.id,
          emoji: reaction.emoji,
          user: {
            id: reaction.user.id,
            name: reaction.user.name,
          },
        })) ?? [],
    };

    this.server.to(`user:${to}`).emit('message:reaction', payload);
    this.server.to(`user:${userId}`).emit('message:reaction', payload);
  }

  @SubscribeMessage('message:read')
  async handleRead(
    @MessageBody() data: any,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const userId = client.user?.id;
    const otherUserId = data?.otherUserId;
    const tempId = data?.tempId;

    if (!userId || !otherUserId) {
      return;
    }

    const unreadMessages = await this.prisma.message.findMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        read: false,
      },
      select: {
        id: true,
      },
    });

    if (unreadMessages.length === 0 && !tempId) {
      return;
    }

    if (unreadMessages.length > 0) {
      await this.prisma.message.updateMany({
        where: {
          senderId: otherUserId,
          receiverId: userId,
          read: false,
        },
        data: {
          read: true,
        },
      });
    }

    const unreadIds = unreadMessages.map((m) => m.id);

    this.server.to(`user:${otherUserId}`).emit('message:read', {
      messageIds: unreadIds,
      readerId: userId,
      tempId,
    });
  }
}
