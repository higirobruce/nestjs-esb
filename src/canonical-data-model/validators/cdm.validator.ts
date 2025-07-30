/**
 * CDM Validator Classes
 * Provides validation logic for CDM entities using class-validator and custom rules
 */

import { validate, ValidatorOptions, ValidationError as ClassValidationError } from 'class-validator';
import { CitizenCDM } from '../schemas/citizen.schema';
import { OrderCDM } from '../schemas/order.schema';
import { ValidationResult, ValidationError, ValidationWarning } from '../types/core.types';

// Generic CDM validator interface
export interface CDMValidator<T> {
  validate(entity: T): Promise<ValidationResult>;
  getSchemaVersion(): string;
}

// Base abstract validator class
export abstract class BaseCDMValidator<T extends object> implements CDMValidator<T> {
  protected readonly schemaVersion: string;

  constructor(schemaVersion: string) {
    this.schemaVersion = schemaVersion;
  }

  async validate(entity: T): Promise<ValidationResult> {
    const validatorOptions: ValidatorOptions = {
      whitelist: true,
      forbidNonWhitelisted: true,
      validationError: { target: false, value: false },
    };

    const errors = await validate(entity, validatorOptions);

    const customValidationResult = this.performCustomValidations(entity);

    const allErrors = [
      ...this.formatValidationErrors(errors),
      ...customValidationResult.errors,
    ];

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: customValidationResult.warnings,
    };
  }

  abstract getSchemaVersion(): string;

  // To be implemented by subclasses for custom validation logic
  protected performCustomValidations(entity: T): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    return { errors: [], warnings: [] };
  }

  protected formatValidationErrors(errors: ClassValidationError[]): ValidationError[] {
    return errors.flatMap(this.formatError.bind(this));
  }

  private formatError(error: ClassValidationError, parentPath: string = ''): ValidationError[] {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;
    let formattedErrors: ValidationError[] = [];

    if (error.constraints) {
      formattedErrors.push({
        field: path,
        code: Object.keys(error.constraints)[0],
        message: Object.values(error.constraints)[0],
        severity: 'error',
      });
    }

    if (error.children && error.children.length > 0) {
      formattedErrors = formattedErrors.concat(
        error.children.flatMap(child => this.formatError(child, path))
      );
    }

    return formattedErrors;
  }
}

// Citizen CDM validator
export class CitizenCDMValidator extends BaseCDMValidator<CitizenCDM> {
  constructor() {
    super('1.0.0');
  }

  getSchemaVersion(): string {
    return `CitizenCDM-v${this.schemaVersion}`;
  }

  protected performCustomValidations(entity: CitizenCDM): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Example custom validation: Check for at least one primary email
    const hasPrimaryEmail = entity.contactInfo.some(
      c => c.type === 'email' && c.isPrimary
    );
    if (!hasPrimaryEmail) {
      warnings.push({
        field: 'contactInfo',
        code: 'MISSING_PRIMARY_CONTACT',
        message: 'No primary email address is specified for the citizen',
      });
    }

    // Example custom validation: Ensure addresses have a country
    entity.addresses.forEach((address, index) => {
      if (!address.country) {
        errors.push({
          field: `addresses[${index}].country`,
          code: 'REQUIRED_FIELD_MISSING',
          message: 'Address country is required',
          severity: 'error',
        });
      }
    });

    return { errors, warnings };
  }
}


// Factory for creating validators based on entity type
export class CDMValidatorFactory {
  static createValidator(entityType: 'citizen' | 'order'): CDMValidator<any> {
    switch (entityType) {
      case 'citizen':
        return new CitizenCDMValidator();
      default:
        throw new Error(`No validator found for entity type: ${entityType}`);
    }
  }
}

