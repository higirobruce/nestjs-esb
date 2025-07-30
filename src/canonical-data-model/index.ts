/**
 * Canonical Data Model Module
 * Central export file for all CDM types, schemas, transformers, and validators
 */

// Core types
export * from './types/core.types';

// Schema definitions
export * from './schemas/citizen.schema';
export * from './schemas/vehicle.schema';
export * from './schemas/official-document.schema';
export * from './schemas/property.schema';
export * from './schemas/order.schema';

// Base transformers and interfaces
export * from './transformers/base.transformer';

// Concrete transformers
export * from './transformers/national-registry-citizen.transformer';

// Validators
export * from './validators/cdm.validator';

// Re-export commonly used types for convenience
export type {
  CDMEntity,
  CDMMetadata,
  ValidationResult,
} from './types/core.types';

export type {
  CitizenCDM,
  EnhancedCitizenCDM,
  CitizenPreferences,
  CitizenLifecycleStage,
} from './schemas/citizen.schema';

export type {
  VehicleCDM,
  LienholderInfo,
} from './schemas/vehicle.schema';

export type {
  OfficialDocumentCDM,
  BiometricInfo,
} from './schemas/official-document.schema';

export type {
  PropertyCDM,
} from './schemas/property.schema';

export type {
  OrderCDM,
  EnhancedOrderCDM,
  OrderLineItem,
  OrderLifecycleStage,
} from './schemas/order.schema';

export type {
  DataTransformer,
  BidirectionalTransformer,
  TransformationFormat,
} from './transformers/base.transformer';

export type {
  CDMValidator,
} from './validators/cdm.validator';
