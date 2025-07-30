import { Controller, Get, Put, Post, Body, Param, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CitizenService, ComprehensiveCitizenProfile } from './citizen.service';
import { CitizenCDM } from '../canonical-data-model/schemas/citizen.schema';

@ApiTags('Citizens')
@Controller('citizens')
export class CitizenController {
  private readonly logger = new Logger(CitizenController.name);

  constructor(private readonly citizenService: CitizenService) {}

  @Get(':nationalId/profile')
  @ApiOperation({ summary: 'Get a comprehensive 360-degree view of a citizen' })
  @ApiParam({ name: 'nationalId', description: 'National ID of the citizen' })
  @ApiResponse({ status: 200, description: 'Aggregated citizen profile' })
  async getComprehensiveProfile(
    @Param('nationalId') nationalId: string,
  ): Promise<ComprehensiveCitizenProfile> {
    this.logger.log(`GET /citizens/${nationalId}/profile`);
    return this.citizenService.getComprehensiveProfile(nationalId);
  }

  @Get(':nationalId')
  @ApiOperation({ summary: 'Get a citizen by National ID' })
  @ApiParam({ name: 'nationalId', description: 'National ID of the citizen' })
  @ApiResponse({ status: 200, description: 'Citizen data in CDM format' })
  @ApiResponse({ status: 404, description: 'Citizen not found' })
  async getCitizen(@Param('nationalId') nationalId: string): Promise<CitizenCDM> {
    this.logger.log(`GET /citizens/${nationalId}`);
    return this.citizenService.getCitizenByNationalId(nationalId);
  }

  @Post('search')
  @ApiOperation({ summary: 'Search for citizens by criteria' })
  @ApiResponse({ status: 200, description: 'List of citizens matching the criteria' })
  async searchCitizens(
    @Body()
    searchCriteria: {
      givenName?: string;
      familyName?: string;
      dateOfBirth?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<CitizenCDM[]> {
    this.logger.log('POST /citizens/search', searchCriteria);
    return this.citizenService.searchCitizens(searchCriteria);
  }

  @Put(':nationalId')
  @ApiOperation({ summary: 'Update citizen information' })
  @ApiParam({ name: 'nationalId', description: 'National ID of the citizen to update' })
  @ApiResponse({ status: 200, description: 'Updated citizen data in CDM format' })
  async updateCitizen(
    @Param('nationalId') nationalId: string,
    @Body() citizenData: CitizenCDM,
  ): Promise<CitizenCDM> {
    this.logger.log(`PUT /citizens/${nationalId}`);
    return this.citizenService.updateCitizen(nationalId, citizenData);
  }

  @Get('mock/transform')
  @ApiOperation({ summary: 'Test transformation with mock data' })
  @ApiResponse({ status: 200, description: 'Mock citizen data transformed to CDM format' })
  async testTransformation(): Promise<CitizenCDM> {
    this.logger.log('GET /citizens/mock/transform');
    return this.citizenService.transformMockCitizenData();
  }
}
