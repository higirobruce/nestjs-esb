import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageRoutingService } from './message-routing.service';
import { MessageRoutingController } from './message-routing.controller';
import { MessageLog } from './entities/message-log.entity';
import { Route } from './entities/message-routing.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Route, MessageLog])],
  controllers: [MessageRoutingController],
  providers: [MessageRoutingService],
  exports: [MessageRoutingService],
})
export class MessageRoutingModule {}
