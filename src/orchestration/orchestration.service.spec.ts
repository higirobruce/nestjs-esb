import { Test, TestingModule } from '@nestjs/testing';
import { OrchestrationService } from './orchestration.service';

describe('OrchestrationService', () => {
  let service: OrchestrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrchestrationService],
    }).compile();

    service = module.get<OrchestrationService>(OrchestrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
