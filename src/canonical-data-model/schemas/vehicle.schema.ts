/**
 * Vehicle Canonical Data Model
 * Represents a motor vehicle registered with a government agency (e.g., DMV).
 */

import {
  CDMEntity,
  Address,
  Money,
  ExternalIdentifier,
  EntityStatus,
  CustomAttribute,
  AuditTrail,
  DateRange,
} from '../types/core.types';

export interface VehicleCDM extends CDMEntity {
  // Core vehicle identification
  vin: string; // Vehicle Identification Number (unique)
  licensePlate: string;
  
  // Vehicle details
  make: string;
  model: string;
  year: number;
  color: string;
  bodyType: 'Sedan' | 'SUV' | 'Truck' | 'Motorcycle' | 'Van' | 'Other';
  
  // Ownership and Registration
  ownerCitizenId: string; // Foreign key to CitizenCDM
  ownerBusinessId?: string; // Foreign key to BusinessCDM
  registrationId: string;
  registrationStatus: EntityStatus;
  registrationDate: Date;
  registrationExpiryDate: Date;
  
  // Financial and Legal Status
  titleStatus: 'Clear' | 'Salvage' | 'Rebuilt' | 'Lien';
  lienholder?: LienholderInfo;
  insuranceStatus: 'Insured' | 'Uninsured' | 'Expired';
  insurancePolicyId?: string;
  
  // Technical specifications
  engineDisplacement?: string;
  fuelType: 'Gasoline' | 'Diesel' | 'Electric' | 'Hybrid' | 'Hydrogen';
  mileage?: number;
  mileageUnit?: 'km' | 'miles';
  lastInspectionDate?: Date;
  
  // External system identifiers
  externalIdentifiers: ExternalIdentifier[];
  
  // Custom attributes for extensibility
  customAttributes: CustomAttribute[];
  
  // Audit trail
  auditTrail: AuditTrail[];
}

export interface LienholderInfo {
  name: string;
  address: Address;
  loanAmount?: Money;
  loanStartDate?: Date;
}

