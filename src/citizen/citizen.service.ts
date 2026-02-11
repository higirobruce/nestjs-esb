import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ServiceIntegrationService } from '../service-integration/service-integration.service';
import { NationalRegistryCitizenTransformer, NationalRegistryCitizen } from '../canonical-data-model/transformers/national-registry-citizen.transformer';
import { CitizenCDM } from '../canonical-data-model';
import { VehicleCDM } from '../canonical-data-model/schemas/vehicle.schema';
import { OfficialDocumentCDM } from '../canonical-data-model/schemas/official-document.schema';
import { TransformationContext } from '../canonical-data-model/transformers/base.transformer';
import { HttpMethod } from 'src/service-integration/entities/service-call.entity';

// Interface for comprehensive citizen profile
export interface ComprehensiveCitizenProfile {
  citizen: CitizenCDM;
  vehicles: VehicleCDM[];
  documents: OfficialDocumentCDM[];
}

@Injectable()
export class CitizenService {
  private readonly logger = new Logger(CitizenService.name);

  constructor(
    private readonly serviceIntegrationService: ServiceIntegrationService,
    private readonly citizenTransformer: NationalRegistryCitizenTransformer,
  ) {}

  /**
   * Get a comprehensive 360-degree profile of a citizen
   * Fetches data from multiple source systems and aggregates it
   */
  async getComprehensiveProfile(nationalId: string): Promise<ComprehensiveCitizenProfile> {
    this.logger.log(`Fetching comprehensive profile for citizen: ${nationalId}`);

    const [citizen, vehicles, documents] = await Promise.all([
      this.getCitizenByNationalId(nationalId),
      this.getVehiclesForCitizen(nationalId),
      this.getDocumentsForCitizen(nationalId),
    ]);

    return { citizen, vehicles, documents };
  }

  /**
   * Get all vehicles registered to a specific citizen.
   * This demonstrates orchestrating a call to a separate vehicle service.
   */
  async getVehiclesForCitizen(nationalId: string): Promise<VehicleCDM[]> {
    this.logger.log(`Fetching vehicles for citizen with National ID: ${nationalId}`);

    try {
      // Step 1: Call the external vehicle service
      const response = await this.serviceIntegrationService.callService({
        serviceName: 'dmv-service', // Hypothetical service for vehicle data
        method: HttpMethod.GET,
        path: `/citizens/${nationalId}/vehicles`,
        correlationId: `vehicle-fetch-${Date.now()}`,
      });

      if (!response.data || !Array.isArray(response.data)) {
        return [];
      }

      // Step 2: In a real implementation, you would transform the response.
      // For this example, we assume the dmv-service already returns data in VehicleCDM format.
      return response.data as VehicleCDM[];

    } catch (error) {
      this.logger.error(`Failed to fetch vehicles for citizen ${nationalId}: ${error.message}`);
      // Return empty array on error to avoid breaking the entire citizen profile view
      return [];
    }
  }

  /**
   * Get all official documents for a specific citizen.
   * This demonstrates orchestrating a call to a document management service.
   */
  async getDocumentsForCitizen(nationalId: string): Promise<OfficialDocumentCDM[]> {
    this.logger.log(`Fetching documents for citizen with National ID: ${nationalId}`);

    try {
      // Step 1: Call the external document service
      const response = await this.serviceIntegrationService.callService({
        serviceName: 'document-service', // Hypothetical service for official documents
        method: HttpMethod.GET,
        path: `/citizens/${nationalId}/documents`,
        correlationId: `document-fetch-${Date.now()}`,
      });

      if (!response.data || !Array.isArray(response.data)) {
        return [];
      }

      // Step 2: In a real implementation, you would transform the response.
      // For this example, we assume the document-service returns data in OfficialDocumentCDM format.
      return response.data as OfficialDocumentCDM[];

    } catch (error) {
      this.logger.error(`Failed to fetch documents for citizen ${nationalId}: ${error.message}`);
      return [];
    }
  }

  /**
   * Get a citizen by National ID from the National Registry
   * Returns data in the standardized CitizenCDM format
   */
  async getCitizenByNationalId(nationalId: string): Promise<CitizenCDM> {
    this.logger.log(`Fetching citizen with National ID: ${nationalId}`);

    try {
      // Step 1: Call the external National Registry API
      const response = await this.serviceIntegrationService.callService({
        serviceName: 'national-registry-service',
        method: HttpMethod.GET,
        path: `/citizens/national-id/${nationalId}`,
        correlationId: `citizen-fetch-${Date.now()}`,
        timeoutMs: 30000,
        maxRetries: 3,
      });

      if (!response.data) {
        throw new NotFoundException(`Citizen with National ID ${nationalId} not found`);
      }

      // Step 2: Transform the external data to CDM format
      const externalData: NationalRegistryCitizen = response.data;
      const transformationContext: TransformationContext = {
        sourceSystem: 'national-registry',
        correlationId: response.correlationId,
        timestamp: new Date(),
      };

      const cdmCitizen = await this.citizenTransformer.toCDM(externalData, transformationContext);

      this.logger.log(`Successfully transformed citizen data for National ID: ${nationalId}`);
      return cdmCitizen;

    } catch (error) {
      this.logger.error(`Failed to fetch citizen ${nationalId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search for citizens by various criteria
   * Returns data in the standardized CitizenCDM format
   */
  async searchCitizens(searchCriteria: {
    givenName?: string;
    familyName?: string;
    dateOfBirth?: string;
    limit?: number;
    offset?: number;
  }): Promise<CitizenCDM[]> {
    this.logger.log('Searching for citizens with criteria:', searchCriteria);

    try {
      // Step 1: Call the external National Registry search API
      const response = await this.serviceIntegrationService.callService({
        serviceName: 'national-registry-service',
        method: HttpMethod.GET,
        path: '/citizens/search',
        body: searchCriteria,
        correlationId: `citizen-search-${Date.now()}`,
        timeoutMs: 30000,
        maxRetries: 2,
      });

      if (!response.data || !Array.isArray(response.data)) {
        return [];
      }

      // Step 2: Transform all external data to CDM format
      const transformationContext: TransformationContext = {
        sourceSystem: 'national-registry',
        correlationId: response.correlationId,
        timestamp: new Date(),
      };

      const cdmCitizens: CitizenCDM[] = [];
      for (const externalData of response.data) {
        try {
          const cdmCitizen = await this.citizenTransformer.toCDM(externalData, transformationContext);
          cdmCitizens.push(cdmCitizen);
        } catch (transformError) {
          this.logger.warn(`Failed to transform citizen data: ${transformError.message}`);
          // Continue processing other citizens
        }
      }

      this.logger.log(`Successfully transformed ${cdmCitizens.length} citizens`);
      return cdmCitizens;

    } catch (error) {
      this.logger.error(`Failed to search citizens: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update citizen information in the National Registry
   * Accepts CDM format and transforms it to the external format
   */
  async updateCitizen(nationalId: string, cdmCitizen: CitizenCDM): Promise<CitizenCDM> {
    this.logger.log(`Updating citizen with National ID: ${nationalId}`);

    try {
      // Step 1: Transform CDM data to external format
      const transformationContext: TransformationContext = {
        sourceSystem: 'esb',
        targetSystem: 'national-registry',
        correlationId: `citizen-update-${Date.now()}`,
        timestamp: new Date(),
      };

      const externalData = await this.citizenTransformer.fromCDM(cdmCitizen, transformationContext);

      // Step 2: Call the external National Registry update API
      const response = await this.serviceIntegrationService.callService({
        serviceName: 'national-registry-service',
        method: HttpMethod.PUT,
        path: `/citizens/${nationalId}`,
        body: externalData,
        correlationId: transformationContext.correlationId,
        timeoutMs: 30000,
        maxRetries: 3,
      });

      // Step 3: Transform the updated data back to CDM format
      const updatedCdmCitizen = await this.citizenTransformer.toCDM(response.data, transformationContext);

      this.logger.log(`Successfully updated citizen with National ID: ${nationalId}`);
      return updatedCdmCitizen;

    } catch (error) {
      this.logger.error(`Failed to update citizen ${nationalId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get citizen data directly without external API calls (for testing)
   * This method demonstrates how to use the transformer in isolation
   */
  async transformMockCitizenData(): Promise<CitizenCDM> {
    const mockExternalData: NationalRegistryCitizen = {
      nationalId: '19900515-1234',
      GivenName: 'Jane',
      firstName: 'Doe',
      DateOfBirth: '1990-05-15',
      Gender: 'Female',
      Email: 'jane.doe@example.com',
      Phone: '+1-555-123-4567',
      ResidentialAddress: '123 Government Ave',
      ResidentialCity: 'Capital City',
      ResidentialPostalCode: '10001',
      ResidentialCountry: 'Nationland',
      Nationality: 'Nationlander',
      RegistrationDate: new Date().toISOString(),
      LastUpdateDate: new Date().toISOString(),
      ResidencyStatus: 'Permanent Resident',
    };

    const transformationContext: TransformationContext = {
      sourceSystem: 'mock-national-registry',
      correlationId: 'mock-transformation',
      timestamp: new Date(),
    };

    return this.citizenTransformer.toCDM(mockExternalData, transformationContext);
  }
}
