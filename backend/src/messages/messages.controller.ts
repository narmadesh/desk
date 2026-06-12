import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Request } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { MessagesService } from './messages.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { SocketGateway } from 'src/socket/socket.gateway';

// Create uploads directory if it doesn't exist
const uploadDirAudio = path.join(process.cwd(), 'uploads', 'audio');
const uploadDirVideo = path.join(process.cwd(), 'uploads', 'video');
const uploadDirScreenRecording = path.join(
  process.cwd(),
  'uploads',
  'screen-recording',
);
const uploadDirFiles = path.join(process.cwd(), 'uploads', 'files');
if (!fs.existsSync(uploadDirAudio)) {
  fs.mkdirSync(uploadDirAudio, { recursive: true });
}

if (!fs.existsSync(uploadDirVideo)) {
  fs.mkdirSync(uploadDirVideo, { recursive: true });
}

if (!fs.existsSync(uploadDirScreenRecording)) {
  fs.mkdirSync(uploadDirScreenRecording, { recursive: true });
}

if (!fs.existsSync(uploadDirFiles)) {
  fs.mkdirSync(uploadDirFiles, { recursive: true });
}

@Controller('/api/messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly socketGateway: SocketGateway,
  ) {}

  @UseGuards(AuthGuard)
  @Get('conversation/:otherId')
  async getConversation(
    @Req() req,
    @Param('otherId') otherId: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    const user = req['user'];
    const limitNum = Math.min(parseInt(limit || '10', 10), 100); // Max 100 per request
    const skipNum = Math.max(parseInt(skip || '0', 10), 0);

    await this.messagesService.markConversationRead(user.id, otherId);
    const result = await this.messagesService.getConversation(
      user.id,
      otherId,
      limitNum,
      skipNum,
    );
    return result;
  }

  @UseGuards(AuthGuard)
  @Post('reaction')
  async addReaction(
    @Req() req,
    @Body() body: { messageId: string; emoji: string },
  ) {
    const user = req['user'];
    return this.messagesService.addReaction(
      user.id,
      body.messageId,
      body.emoji,
    );
  }

  @UseGuards(AuthGuard)
  @Post('audio')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: diskStorage({
        destination: uploadDirAudio,
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `audio-${uniqueSuffix}.webm`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.includes('audio')) {
          return cb(
            new BadRequestException('Only audio files are allowed'),
            true,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    }),
  )
  async uploadAudio(
    @Req() req,
    @UploadedFile() file,
    @Body() body: { to: string; duration: string; message: string },
  ) {
    if (!file) {
      throw new BadRequestException('No audio file provided');
    }
    const user = req['user'];
    const voiceUrl = `/uploads/audio/${file.filename}`;
    const duration = parseFloat(body.duration) || 0;

    const savedMessage = await this.messagesService.createAudioMessage(
      user.id,
      body.to,
      voiceUrl,
      duration,
      body.message,
    );
    const payload = {
      id: savedMessage.id,
      tempId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      message: savedMessage.content,
      content: savedMessage.content,
      voiceUrl: savedMessage.voiceUrl,
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
    if (savedMessage.group) {
      savedMessage.group.members.forEach(function (member) {
        sock.to(`user:${member.userId}`).emit('message:new', payload);
      });
      this.socketGateway.server
        .to(`user:${savedMessage.receiverId}`)
        .emit('message:new', payload);
    } else {
      this.socketGateway.server
        .to(`user:${savedMessage.receiverId}`)
        .emit('message:new', payload);
      this.socketGateway.server
        .to(`user:${savedMessage.senderId}`)
        .emit('message:new', payload);
    }

    return savedMessage;
  }

  @UseGuards(AuthGuard)
  @Post('video')
  @UseInterceptors(
    FileInterceptor('video', {
      storage: diskStorage({
        destination: uploadDirVideo,
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `video-${uniqueSuffix}.webm`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.includes('video')) {
          return cb(
            new BadRequestException('Only video files are allowed'),
            true,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    }),
  )
  async uploadVideo(
    @Req() req,
    @UploadedFile() file,
    @Body() body: { to: string; duration: string; message: string },
  ) {
    if (!file) {
      throw new BadRequestException('No video file provided');
    }
    const user = req['user'];
    const videoUrl = `/uploads/video/${file.filename}`;
    const duration = parseFloat(body.duration) || 0;

    const savedMessage = await this.messagesService.createVideoMessage(
      user.id,
      body.to,
      videoUrl,
      duration,
      body.message,
    );
    const payload = {
      id: savedMessage.id,
      tempId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      message: savedMessage.content,
      content: savedMessage.content,
      videoUrl: savedMessage.videoUrl,
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
    if (savedMessage.group) {
      savedMessage.group.members.forEach(function (member) {
        sock.to(`user:${member.userId}`).emit('message:new', payload);
      });
      this.socketGateway.server
        .to(`user:${savedMessage.receiverId}`)
        .emit('message:new', payload);
    } else {
      this.socketGateway.server
        .to(`user:${savedMessage.receiverId}`)
        .emit('message:new', payload);
      this.socketGateway.server
        .to(`user:${savedMessage.senderId}`)
        .emit('message:new', payload);
    }
    return savedMessage;
  }

  @UseGuards(AuthGuard)
  @Post('screen-recording')
  @UseInterceptors(
    FileInterceptor('screenRecording', {
      storage: diskStorage({
        destination: uploadDirScreenRecording,
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `screen-recording-${uniqueSuffix}.webm`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.includes('video')) {
          return cb(
            new BadRequestException('Only video files are allowed'),
            true,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    }),
  )
  async uploadScreenRecording(
    @Req() req,
    @UploadedFile() file,
    @Body() body: { to: string; duration: string; message: string },
  ) {
    if (!file) {
      throw new BadRequestException('No screen recording file provided');
    }
    const user = req['user'];
    const screenRecordingUrl = `/uploads/screen-recording/${file.filename}`;
    const duration = parseFloat(body.duration) || 0;

    const savedMessage =
      await this.messagesService.createScreenRecordingMessage(
        user.id,
        body.to,
        screenRecordingUrl,
        duration,
        body.message,
      );
    const payload = {
      id: savedMessage.id,
      tempId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      message: savedMessage.content,
      content: savedMessage.content,
      screenRecordingUrl: savedMessage.screenRecordingUrl,
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
    if (savedMessage.group) {
      savedMessage.group.members.forEach(function (member) {
        sock.to(`user:${member.userId}`).emit('message:new', payload);
      });
      this.socketGateway.server
        .to(`user:${savedMessage.receiverId}`)
        .emit('message:new', payload);
    } else {
      this.socketGateway.server
        .to(`user:${savedMessage.receiverId}`)
        .emit('message:new', payload);
      this.socketGateway.server
        .to(`user:${savedMessage.senderId}`)
        .emit('message:new', payload);
    }
    return savedMessage;
  }

  @UseGuards(AuthGuard)
  @Post('files')
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: diskStorage({
        destination: uploadDirFiles,
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `file-${uniqueSuffix}.${path.extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    }),
  )
  async uploadFiles(
    @Req() req,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: { to: string; duration: string; message: string },
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No file provided');
    }
    const user = req['user'];

    const savedMessage = await this.messagesService.createAttachments(
      user.id,
      body.to,
      files,
      body.message,
    );
    const payload = {
      id: savedMessage.id,
      tempId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      message: savedMessage.content,
      content: savedMessage.content,
      read: false,
      sent: true,
      delivered: false,
      from: savedMessage.sender,
      to: savedMessage.receiverId,
      timestamp: savedMessage?.createdAt?.toISOString(),
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
      reactions: savedMessage?.reactions?.map((reaction) => ({
        id: reaction.id,
        emoji: reaction.emoji,
        user: {
          id: reaction.user.id,
          name: reaction.user.name,
        },
      })),
      attachments: savedMessage?.attachments?.map((attachment) => ({
        id: attachment.id,
        name: attachment.name,
        url: attachment.url,
        mimeType: attachment.mimeType,
        size: attachment.size,
      })),
    };
    const sock = this.socketGateway.server;
    if (savedMessage.group) {
      savedMessage.group.members.forEach(function (member) {
        sock.to(`user:${member.userId}`).emit('message:new', payload);
      });
      this.socketGateway.server
        .to(`user:${savedMessage.receiverId}`)
        .emit('message:new', payload);
    } else {
      this.socketGateway.server
        .to(`user:${savedMessage.receiverId}`)
        .emit('message:new', payload);
      this.socketGateway.server
        .to(`user:${savedMessage.senderId}`)
        .emit('message:new', payload);
    }
    return savedMessage;
  }
}
