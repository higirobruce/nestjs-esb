/**
 * Official Document Canonical Data Model
 * Represents an official document issued by a government agency.
 */

import {
  CDMEntity,
  ExternalIdentifier,
  EntityStatus,
  CustomAttribute,
  AuditTrail,
} from '../types/core.types';

export interface OfficialDocumentCDM extends CDMEntity {
  // Core document identification
  documentId: string;
  documentType: 'Passport' | 'DriverLicense' | 'NationalIDCard' | 'BirthCertificate' | 'Visa';
  
  // Holder information
  holderCitizenId: string; // Foreign key to CitizenCDM
  
  // Document details
  issuingAuthority: string; // e.g., "Department of State", "DMV"
  issueDate: Date;
  expirationDate?: Date;
  
  // Document status
  documentStatus: EntityStatus;
  
  // Physical and digital properties
  physicalCopyExists: boolean;
  digitalCopyUrl?: string;
  biometricData?: BiometricInfo;
  
  // External system identifiers
  externalIdentifiers: ExternalIdentifier[];
  
  // Custom attributes for extensibility
  customAttributes: CustomAttribute[];
  
  // Audit trail
  auditTrail: AuditTrail[];
}

export interface BiometricInfo {
  photoUrl?: string;
  fingerprintHash?: string;
  irisScanHash?: string;
}

