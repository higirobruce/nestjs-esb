import { Test, TestingModule } from '@nestjs/testing';
import { ServiceRegistryController } from './service-registry.controller';
import { ServiceRegistryService } from './service-registry.service';

describe('ServiceRegistryController', () => {
  let controller: ServiceRegistryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceRegistryController],
      providers: [ServiceRegistryService],
    }).compile();

    controller = module.get<ServiceRegistryController>(ServiceRegistryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
