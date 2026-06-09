import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { PrismaModule } from 'src/prisma.module';
import { SocketGateway } from 'src/socket/socket.gateway';

@Module({
  imports: [PrismaModule],
  providers: [MessagesService, SocketGateway],
  controllers: [MessagesController],
  exports: [MessagesService,SocketGateway],
})
export class MessagesModule {}
