/**
 * Citizen Canonical Data Model
 * Represents a unified citizen entity that can be transformed from/to various formats
 */

import {
  CDMEntity,
  Address,
  ContactInfo,
  ExternalIdentifier,
  EntityStatus,
  CustomAttribute,
  EntityRelationship,
  DataQuality,
  AuditTrail,
} from '../types/core.types';

export interface CitizenCDM extends CDMEntity {
  // Core customer identification
  firstName: string;
  lastName: string;
  middleName?: string;
  displayName?: string;
  title?: string; // Mr., Ms., Dr., etc.
  suffix?: string; // Jr., Sr., III, etc.
  
  // Business information
  companyName?: string;
  jobTitle?: string;
  department?: string;
  
  // Demographics
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  nationality?: string;
  preferredLanguage?: string;
  
  // Contact information
  addresses: Address[];
  contactInfo: ContactInfo[];
  
  // Status and lifecycle
  status: EntityStatus;
  customerSince?: Date;
  lastActivityDate?: Date;
  
  // External system identifiers
  externalIdentifiers: ExternalIdentifier[];
  
  // Preferences
  preferences: CitizenPreferences;
  
  // Relationships to other entities
  relationships: EntityRelationship[];
  
  // Custom attributes for extensibility
  customAttributes: CustomAttribute[];
  
  // Data quality metrics
  dataQuality: DataQuality;
  
  // Audit trail
  auditTrail: AuditTrail[];
}

export interface CitizenPreferences {
  communicationChannel: 'email' | 'sms' | 'phone' | 'mail' | 'none';
  marketingOptIn: boolean;
  newsletterOptIn: boolean;
  dataProcessingConsent: boolean;
  consentDate?: Date;
  privacySettings: PrivacySettings;
  notificationPreferences: NotificationPreferences;
}

export interface PrivacySettings {
  shareDataWithPartners: boolean;
  allowAnalytics: boolean;
  allowPersonalization: boolean;
  dataBiome: string[];
}

export interface NotificationPreferences {
  orderUpdates: boolean;
  promotionalEmails: boolean;
  securityAlerts: boolean;
  accountUpdates: boolean;
  frequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
}

// Citizen segments for classification
export interface CitizenSegment {
  id: string;
  name: string;
  category: string;
  criteria: Record<string, any>;
  assignedDate: Date;
  confidence: number; // 0-1
}

// Citizen lifecycle stages
export enum CitizenLifecycleStage {
  PROSPECT = 'prospect',
  LEAD = 'lead',
  OPPORTUNITY = 'opportunity',
  CITIZEN = 'citizen',
  ADVOCATE = 'advocate',
  INACTIVE = 'inactive',
  CHURNED = 'churned'
}

// Extended citizen model with government context
export interface EnhancedCitizenCDM extends CitizenCDM {
  segments: CitizenSegment[];
  lifecycleStage: CitizenLifecycleStage;
  riskScore?: number; // 0-100
  creditRating?: string;
  loyaltyLevel?: 'bronze' | 'silver' | 'gold' | 'platinum';
  
  // Financial information
  estimatedValue?: number;
  totalSpent?: number;
  averageOrderValue?: number;
  
  // Behavioral data
  lastPurchaseDate?: Date;
  purchaseFrequency?: number;
  preferredCategories?: string[];
  
  // Support and service
  supportTickets?: number;
  satisfactionScore?: number; // 1-10
  npsScore?: number; // -100 to 100
}
