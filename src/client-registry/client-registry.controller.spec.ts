import { Test, TestingModule } from '@nestjs/testing';
import { ClientRegistryController } from './client-registry.controller';
import { ClientRegistryService } from './client-registry.service';

describe('ClientRegistryController', () => {
  let controller: ClientRegistryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientRegistryController],
      providers: [ClientRegistryService],
    }).compile();

    controller = module.get<ClientRegistryController>(ClientRegistryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
