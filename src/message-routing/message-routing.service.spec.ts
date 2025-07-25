import { Test, TestingModule } from '@nestjs/testing';
import { MessageRoutingService } from './message-routing.service';

describe('MessageRoutingService', () => {
  let service: MessageRoutingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MessageRoutingService],
    }).compile();

    service = module.get<MessageRoutingService>(MessageRoutingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
