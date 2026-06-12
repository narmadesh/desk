import { Injectable } from '@nestjs/common';
import { Attachment } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async getConversation(
    currentUserId: string,
    otherUserId: string,
    limit: number = 10,
    skip: number = 0,
  ) {
    const group = await this.prisma.group.findFirst({
      where: { id: otherUserId },
    });
    const query: any = [];
    if (group) {
      query.push({ receiverId: otherUserId });
    } else {
      query.push({ senderId: currentUserId, receiverId: otherUserId });
      query.push({ senderId: otherUserId, receiverId: currentUserId });
    }
    const totalCount = await this.prisma.message.count({
      where: {
        OR: query,
      },
    });

    const messages = await this.prisma.message.findMany({
      where: {
        OR: query,
      },
      select: {
        id: true,
        content: true,
        voiceUrl: true,
        videoUrl: true,
        screenRecordingUrl: true,
        messageType: true,
        senderId: true,
        receiverId: true,
        createdAt: true,
        read: true,
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
        attachments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: skip,
    });

    return {
      messages: messages.reverse(),
      totalCount,
      hasMore: skip + limit < totalCount,
    };
  }

  async markConversationRead(currentUserId: string, otherUserId: string) {
    await this.prisma.message.updateMany({
      where: {
        receiverId: currentUserId,
        senderId: otherUserId,
        read: false,
      },
      data: {
        read: true,
      },
    });
  }

  async addReaction(messageId: string, userId: string, emoji: string) {
    const existingReaction = await this.prisma.messageReaction.findFirst({
      where: {
        messageId,
        userId,
      },
    });

    if (existingReaction) {
      return this.prisma.messageReaction.update({
        where: { id: existingReaction.id },
        data: { emoji },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    }

    return this.prisma.messageReaction.create({
      data: {
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
  }

  async createAudioMessage(
    senderId: string,
    receiverId: string,
    voiceUrl: string,
    duration: number,
    content: string,
  ) {
    const message = await this.prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
        voiceUrl,
        duration,
        tempId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
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
    const group = await this.prisma.group.findFirst({
      where: { id: receiverId },
      include: { members: true },
    });
    return {
      ...message,
      voiceUrl: message.voiceUrl,
      group,
    };
  }

  async createVideoMessage(
    senderId: string,
    receiverId: string,
    videoUrl: string,
    duration: number,
    content: string,
  ) {
    const message = await this.prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
        videoUrl,
        duration,
        tempId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
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
    const group = await this.prisma.group.findFirst({
      where: { id: receiverId },
      include: { members: true },
    });
    return {
      ...message,
      videoUrl: message.videoUrl,
      group,
    };
  }

  async createScreenRecordingMessage(
    senderId: string,
    receiverId: string,
    screenRecordingUrl: string,
    duration: number,
    content: string,
  ) {
    const message = await this.prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
        screenRecordingUrl,
        duration,
        tempId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
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

    const group = await this.prisma.group.findFirst({
      where: { id: receiverId },
      include: { members: true },
    });
    return {
      ...message,
      screenRecordingUrl: message.screenRecordingUrl,
      group,
    };
  }

  async createAttachments(
    senderId: string,
    receiverId: string,
    files: Express.Multer.File[],
    content: string,
  ) {
    const message = await this.prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
        tempId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
    });
    for (const file of files) {
      const fileUrl = `/uploads/files/${file.filename}`;
      await this.prisma.attachment.create({
        data: {
          messageId: message.id,
          url: fileUrl,
          name: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          userId: senderId,
        },
      });
    }

    const messageWithAttachments = await this.prisma.message.findUnique({
      where: { id: message.id },
      include: {
        attachments: true,
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

    const group = await this.prisma.group.findFirst({
      where: { id: receiverId },
      include: { members: true },
    });
    return {
      ...messageWithAttachments,
      group,
    };
  }
}
