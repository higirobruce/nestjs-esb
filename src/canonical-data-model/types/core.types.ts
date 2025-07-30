/**
 * Core Canonical Data Model Types
 * Defines the foundational types and interfaces for data transformation in the ESB
 */

// Base metadata that all CDM entities should have
export interface CDMMetadata {
  sourceSystem: string;
  sourceId: string;
  timestamp: Date;
  version: string;
  correlationId?: string;
  dataClassification?: 'public' | 'internal' | 'confidential' | 'restricted';
  transformationHistory?: TransformationStep[];
}

export interface TransformationStep {
  transformer: string;
  timestamp: Date;
  sourceFormat: string;
  targetFormat: string;
  version: string;
}

// Base CDM entity that all canonical models extend
export interface CDMEntity {
  id: string;
  metadata: CDMMetadata;
  createdAt: Date;
  updatedAt: Date;
}

// Address structure (reusable across multiple entities)
export interface Address {
  type: 'home' | 'work' | 'billing' | 'shipping' | 'other';
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  isPrimary?: boolean;
}

// Contact information structure
export interface ContactInfo {
  type: 'email' | 'phone' | 'fax' | 'mobile';
  value: string;
  isPrimary?: boolean;
  isVerified?: boolean;
}

// Common identifier structure for external system references
export interface ExternalIdentifier {
  system: string;
  value: string;
  type?: string;
}

// Money/Currency structure
export interface Money {
  amount: number;
  currency: string; // ISO 4217 currency code
}

// Date range structure
export interface DateRange {
  startDate: Date;
  endDate?: Date;
}

// Status structure for entities with lifecycle states
export interface EntityStatus {
  code: string;
  name: string;
  category: 'active' | 'inactive' | 'pending' | 'suspended' | 'terminated';
  effectiveDate: Date;
  reason?: string;
}

// Audit trail for changes
export interface AuditTrail {
  action: 'create' | 'update' | 'delete' | 'view';
  timestamp: Date;
  userId?: string;
  system: string;
  changes?: Record<string, { from: any; to: any }>;
}

// Generic attribute for extensibility
export interface CustomAttribute {
  name: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  source?: string;
}

// Validation result structure
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
}

// Data quality indicators
export interface DataQuality {
  completenessScore: number; // 0-100
  accuracyScore: number; // 0-100
  consistencyScore: number; // 0-100
  timelinessScore: number; // 0-100
  lastAssessment: Date;
  issues: DataQualityIssue[];
}

export interface DataQualityIssue {
  type: 'missing' | 'invalid' | 'inconsistent' | 'outdated';
  field: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Relationship structure for linking entities
export interface EntityRelationship {
  relatedEntityId: string;
  relatedEntityType: string;
  relationshipType: string;
  direction: 'inbound' | 'outbound' | 'bidirectional';
  effectiveDate: Date;
  endDate?: Date;
  attributes?: Record<string, any>;
}
