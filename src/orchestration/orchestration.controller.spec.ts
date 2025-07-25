import { Test, TestingModule } from '@nestjs/testing';
import { OrchestrationController } from './orchestration.controller';
import { OrchestrationService } from './orchestration.service';

describe('OrchestrationController', () => {
  let controller: OrchestrationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrchestrationController],
      providers: [OrchestrationService],
    }).compile();

    controller = module.get<OrchestrationController>(OrchestrationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
