/**
 * National Registry Citizen to CDM Transformer
 * Transforms National Registry citizen data to Citizen CDM format
 */

import { BaseBidirectionalTransformer, TransformationContext, TransformationFormat } from './base.transformer';
import { CitizenCDM } from '../schemas/citizen.schema';
import { ValidationResult, ValidationError } from '../types/core.types';

// National Registry data structure (simplified)
export interface NationalRegistryCitizen {
  nationalId: string;
  GivenName: string;
  firstName: string;
  lastName?: string;
  DateOfBirth: string;
  Gender?: string;
  Email?: string;
  Phone?: string;
  MobilePhone?: string;
  ResidentialAddress?: string;
  ResidentialCity?: string;
  ResidentialState?: string;
  ResidentialPostalCode?: string;
  ResidentialCountry?: string;
  MailingAddress?: string;
  MailingCity?: string;
  MailingState?: string;
  MailingPostalCode?: string;
  MailingCountry?: string;
  CountryOfBirth?: string;
  Nationality?: string;
  PreferredLanguage?: string;
  RegistrationDate: string;
  LastUpdateDate: string;
  ResidencyStatus?: string;
  GovernmentServicesOptIn?: boolean;
  NotificationOptIn?: boolean;
  // Custom fields
  [key: string]: any;
}

export class NationalRegistryCitizenTransformer extends BaseBidirectionalTransformer<NationalRegistryCitizen, CitizenCDM> {
  constructor() {
    super('NationalRegistryCitizenTransformer', '1.0.0');
  }

  async toCDM(registryData: NationalRegistryCitizen, context?: TransformationContext): Promise<CitizenCDM> {
    this.logTransformation('NationalRegistry', 'CDM', context);

    const cdmCitizen: CitizenCDM = {
      id: `national-registry-${registryData.nationalId}`,
      metadata: {
        sourceSystem: context?.sourceSystem || 'national-registry',
        sourceId: registryData.nationalId,
        timestamp: context?.timestamp || new Date(),
        version: this.getVersion(),
        correlationId: context?.correlationId,
        transformationHistory: [],
      },
      createdAt: new Date(registryData.RegistrationDate) ,
      updatedAt: new Date(registryData.LastUpdateDate),

      // Core identification
      firstName: registryData.GivenName || '',
      lastName: registryData.firstName || '',
      middleName: registryData.lastName,
      displayName: `${registryData.GivenName || ''} ${registryData.firstName || ''}`.trim(),

      // Demographics
      dateOfBirth: registryData.DateOfBirth ? new Date(registryData.DateOfBirth) : undefined,
      gender: registryData.Gender?.toLowerCase() as any,
      nationality: registryData.Nationality,
      preferredLanguage: registryData.PreferredLanguage,

      // Addresses
      addresses: this.transformAddresses(registryData),

      // Contact information
      contactInfo: this.transformContactInfo(registryData),

      // Status
      status: {
        code: registryData.ResidencyStatus || 'active',
        name: registryData.ResidencyStatus || 'Active',
        category: 'active',
        effectiveDate: new Date(registryData.LastUpdateDate),
      },

      customerSince: new Date(registryData.RegistrationDate),

      // External identifiers
      externalIdentifiers: [
        {
          system: 'national-registry',
          value: registryData.nationalId,
          type: 'national_id',
        },
      ],

      // Preferences
      preferences: {
        communicationChannel: registryData.Email ? 'email' : 'phone',
        marketingOptIn: registryData.GovernmentServicesOptIn || false,
        newsletterOptIn: registryData.NotificationOptIn || false,
        dataProcessingConsent: true, // Assume consent if in registry
        privacySettings: {
          shareDataWithPartners: false,
          allowAnalytics: true,
          allowPersonalization: true,
          dataBiome: ['government', 'public-services'],
        },
        notificationPreferences: {
          orderUpdates: false,
          promotionalEmails: false,
          securityAlerts: true,
          accountUpdates: true,
          frequency: 'immediate',
        },
      },

      // Relationships, custom attributes, data quality, and audit trail
      relationships: [],
      customAttributes: this.transformCustomAttributes(registryData),
      dataQuality: {
        completenessScore: this.calculateCompletenessScore(registryData),
        accuracyScore: 95, // Government data typically more accurate
        consistencyScore: 95, // Government data typically more consistent
        timelinessScore: 90, // Depends on update frequency
        lastAssessment: new Date(),
        issues: [],
      },
      auditTrail: [{
        action: 'create',
        timestamp: context?.timestamp || new Date(),
        system: context?.sourceSystem || 'national-registry',
        userId: context?.userId,
      }],
    };

    this.addTransformationHistory(cdmCitizen, 'NationalRegistry', 'CDM', context);

    return cdmCitizen;
  }

  async fromCDM(cdm: CitizenCDM, context?: TransformationContext): Promise<NationalRegistryCitizen> {
    this.logTransformation('CDM', 'NationalRegistry', context);

    const primaryEmail = cdm.contactInfo.find(c => c.type === 'email' && c.isPrimary)?.value ||
                        cdm.contactInfo.find(c => c.type === 'email')?.value;

    const primaryPhone = cdm.contactInfo.find(c => c.type === 'phone' && c.isPrimary)?.value ||
                        cdm.contactInfo.find(c => c.type === 'phone')?.value;

    const mobilePhone = cdm.contactInfo.find(c => c.type === 'mobile')?.value;

    const residentialAddress = cdm.addresses.find(a => a.type === 'home' || a.isPrimary) ||
                             cdm.addresses[0];

    const mailingAddress = cdm.addresses.find(a => a.type === 'shipping') || // Assuming 'shipping' maps to mailing
                         cdm.addresses.find(a => a.type === 'home') ||
                         cdm.addresses[0];

    const nationalId = cdm.externalIdentifiers.find(
      id => id.system === 'national-registry' && id.type === 'national_id'
    )?.value;

    const registryData: NationalRegistryCitizen = {
      nationalId: nationalId || cdm.metadata.sourceId,
      GivenName: cdm.firstName,
      firstName: cdm.lastName,
      Email: primaryEmail,
      Phone: primaryPhone,
      MobilePhone: mobilePhone,
      DateOfBirth: cdm.dateOfBirth?.toISOString().split('T')[0],
      Gender: cdm.gender,
      Nationality: cdm.nationality,
      PreferredLanguage: cdm.preferredLanguage,
      RegistrationDate: cdm.createdAt.toISOString(),
      LastUpdateDate: cdm.updatedAt.toISOString(),
      ResidencyStatus: cdm.status.code,
      GovernmentServicesOptIn: cdm.preferences.marketingOptIn,
      NotificationOptIn: cdm.preferences.newsletterOptIn,
    };

    // Add address information
    if (residentialAddress) {
      registryData.ResidentialAddress = residentialAddress.line1 + (residentialAddress.line2 ? '\n' + residentialAddress.line2 : '');
      registryData.ResidentialCity = residentialAddress.city;
      registryData.ResidentialState = residentialAddress.state;
      registryData.ResidentialPostalCode = residentialAddress.postalCode;
      registryData.ResidentialCountry = residentialAddress.country;
    }

    if (mailingAddress && mailingAddress !== residentialAddress) {
      registryData.MailingAddress = mailingAddress.line1 + (mailingAddress.line2 ? '\n' + mailingAddress.line2 : '');
      registryData.MailingCity = mailingAddress.city;
      registryData.MailingState = mailingAddress.state;
      registryData.MailingPostalCode = mailingAddress.postalCode;
      registryData.MailingCountry = mailingAddress.country;
    }

    // Add custom attributes as custom fields
    for (const attr of cdm.customAttributes) {
      if (attr.source === 'national-registry') {
        registryData[attr.name] = attr.value;
      }
    }

    return registryData;
  }

  async validateExternal(data: NationalRegistryCitizen): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    if (!data.nationalId) {
      errors.push({
        field: 'NationalID',
        code: 'REQUIRED_FIELD_MISSING',
        message: 'National ID is required',
        severity: 'error',
      });
    }

    if (!data.GivenName && !data.firstName) {
      errors.push({
        field: 'name',
        code: 'REQUIRED_FIELD_MISSING',
        message: 'Given name or family name is required',
        severity: 'error',
      });
    }

    if (data.Email && !this.isValidEmail(data.Email)) {
      errors.push({
        field: 'Email',
        code: 'INVALID_FORMAT',
        message: 'Invalid email format',
        severity: 'error',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  async validateCDM(data: CitizenCDM): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    if (!data.firstName && !data.lastName) {
      errors.push({
        field: 'name',
        code: 'REQUIRED_FIELD_MISSING',
        message: 'First name or last name is required',
        severity: 'error',
      });
    }

    const emailContacts = data.contactInfo.filter(c => c.type === 'email');
    for (const email of emailContacts) {
      if (!this.isValidEmail(email.value)) {
        errors.push({
          field: 'contactInfo.email',
          code: 'INVALID_FORMAT',
          message: `Invalid email format: ${email.value}`,
          severity: 'error',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  getSupportedFormats(): TransformationFormat[] {
    return [
      {
        name: 'NationalRegistry',
        version: '1.0',
        mimeType: 'application/json',
        description: 'National Registry Citizen object format',
      },
    ];
  }

  private transformAddresses(registryData: NationalRegistryCitizen) {
    const addresses = [];

    // Residential address
    if (registryData.ResidentialAddress || registryData.ResidentialCity) {
      addresses.push({
        type: 'home' as const,
        line1: registryData.ResidentialAddress?.split('\n')[0] || '',
        line2: registryData.ResidentialAddress?.split('\n')[1],
        city: registryData.ResidentialCity || '',
        state: registryData.ResidentialState,
        postalCode: registryData.ResidentialPostalCode || '',
        country: registryData.ResidentialCountry || 'US',
        isPrimary: true,
      });
    }

    // Mailing address (if different)
    if (registryData.MailingAddress && 
        registryData.MailingAddress !== registryData.ResidentialAddress) {
      addresses.push({
        type: 'shipping' as const, // Using 'shipping' as mailing
        line1: registryData.MailingAddress?.split('\n')[0] || '',
        line2: registryData.MailingAddress?.split('\n')[1],
        city: registryData.MailingCity || '',
        state: registryData.MailingState,
        postalCode: registryData.MailingPostalCode || '',
        country: registryData.MailingCountry || 'US',
        isPrimary: false,
      });
    }

    return addresses;
  }

  private transformContactInfo(registryData: NationalRegistryCitizen) {
    const contactInfo = [];

    if (registryData.Email) {
      contactInfo.push({
        type: 'email' as const,
        value: registryData.Email,
        isPrimary: true,
        isVerified: false,
      });
    }

    if (registryData.Phone) {
      contactInfo.push({
        type: 'phone' as const,
        value: registryData.Phone,
        isPrimary: true,
        isVerified: false,
      });
    }

    if (registryData.MobilePhone) {
      contactInfo.push({
        type: 'mobile' as const,
        value: registryData.MobilePhone,
        isPrimary: false,
        isVerified: false,
      });
    }

    return contactInfo;
  }

  private transformCustomAttributes(registryData: NationalRegistryCitizen) {
    const customAttributes = [];
    const standardFields = new Set([
      'NationalID', 'GivenName', 'FamilyName', 'MiddleName', 'DateOfBirth', 'Gender', 'Email',
      'Phone', 'MobilePhone', 'ResidentialAddress', 'ResidentialCity', 'ResidentialState',
      'ResidentialPostalCode', 'ResidentialCountry', 'MailingAddress', 'MailingCity',
      'MailingState', 'MailingPostalCode', 'MailingCountry', 'CountryOfBirth', 'Nationality',
      'PreferredLanguage', 'RegistrationDate', 'LastUpdateDate', 'ResidencyStatus',
      'GovernmentServicesOptIn', 'NotificationOptIn'
    ]);

    for (const [key, value] of Object.entries(registryData)) {
      if (!standardFields.has(key) && value !== null && value !== undefined) {
        customAttributes.push({
          name: key,
          value,
          type: typeof value as any,
          source: 'national-registry',
        });
      }
    }

    return customAttributes;
  }

  private calculateCompletenessScore(registryData: NationalRegistryCitizen): number {
    const requiredFields = ['NationalID', 'GivenName', 'FamilyName', 'DateOfBirth'];
    const optionalFields = ['Email', 'Phone', 'ResidentialAddress', 'Nationality'];
    
    let score = 0;
    let totalWeight = 0;

    // Required fields (weight: 10 each)
    for (const field of requiredFields) {
      totalWeight += 10;
      if (registryData[field]) {
        score += 10;
      }
    }

    // Optional fields (weight: 5 each)
    for (const field of optionalFields) {
      totalWeight += 5;
      if (registryData[field]) {
        score += 5;
      }
    }

    return Math.round((score / totalWeight) * 100);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
