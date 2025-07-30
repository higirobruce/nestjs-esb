/**
 * Property Canonical Data Model
 * Represents a real estate or land parcel registered with a government agency.
 */

import {
  CDMEntity,
  Address,
  Money,
  ExternalIdentifier,
  EntityStatus,
  CustomAttribute,
  AuditTrail,
} from '../types/core.types';

export interface PropertyCDM extends CDMEntity {
  // Core property identification
  parcelId: string; // Unique identifier for the land parcel
  legalDescription: string;
  propertyAddress: Address;
  
  // Property details
  propertyType: 'Residential' | 'Commercial' | 'Industrial' | 'Agricultural' | 'VacantLand';
  zoningType: string;
  lotSize: number;
  lotSizeUnit: 'sqft' | 'sqm' | 'acres';
  
  // Ownership
  ownerCitizenId?: string; // Foreign key to CitizenCDM
  ownerBusinessId?: string; // Foreign key to BusinessCDM
  ownershipType: 'Sole' | 'Joint' | 'Corporate';
  
  // Valuation and Taxation
  assessedValue: Money;
  lastAssessmentDate: Date;
  taxId: string;
  taxStatus: EntityStatus;
  
  // Legal status
  titleStatus: 'Clear' | 'Lien' | 'Disputed';
  deedReference: string;
  
  // External system identifiers
  externalIdentifiers: ExternalIdentifier[];
  
  // Custom attributes for extensibility
  customAttributes: CustomAttribute[];
  
  // Audit trail
  auditTrail: AuditTrail[];
}

