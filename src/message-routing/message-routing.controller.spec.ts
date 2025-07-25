import { Test, TestingModule } from '@nestjs/testing';
import { MessageRoutingController } from './message-routing.controller';
import { MessageRoutingService } from './message-routing.service';

describe('MessageRoutingController', () => {
  let controller: MessageRoutingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessageRoutingController],
      providers: [MessageRoutingService],
    }).compile();

    controller = module.get<MessageRoutingController>(MessageRoutingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
