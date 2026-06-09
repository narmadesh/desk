import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { SocketGateway } from 'src/socket/socket.gateway';
import { PrismaModule } from 'src/prisma.module';

@Module({
  controllers: [GroupController],
  providers: [GroupService, SocketGateway],
  imports: [PrismaModule],
  exports: [GroupService, SocketGateway],
})
export class GroupModule {}
