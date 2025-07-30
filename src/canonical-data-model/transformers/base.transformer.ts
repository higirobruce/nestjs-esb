/**
 * Base Transformer Classes and Interfaces
 * Provides the foundation for transforming data between external formats and CDM
 */

import { ValidationResult, CDMEntity, TransformationStep } from '../types/core.types';

// Generic transformer interface
export interface DataTransformer<TSource, TTarget> {
  transform(source: TSource, context?: TransformationContext): Promise<TTarget>;
  validate(data: TSource): Promise<ValidationResult>;
  getVersion(): string;
  getSupportedFormats(): TransformationFormat[];
}

// Bidirectional transformer for formats that can go both ways
export interface BidirectionalTransformer<TExternal, TCdm extends CDMEntity> {
  toCDM(external: TExternal, context?: TransformationContext): Promise<TCdm>;
  fromCDM(cdm: TCdm, context?: TransformationContext): Promise<TExternal>;
  validateExternal(data: TExternal): Promise<ValidationResult>;
  validateCDM(data: TCdm): Promise<ValidationResult>;
  getVersion(): string;
  getSupportedFormats(): TransformationFormat[];
}

// Transformation context for providing additional information during transformation
export interface TransformationContext {
  sourceSystem: string;
  targetSystem?: string;
  correlationId?: string;
  userId?: string;
  timestamp: Date;
  options?: Record<string, any>;
  metadata?: Record<string, any>;
}

// Supported transformation formats
export interface TransformationFormat {
  name: string;
  version: string;
  mimeType?: string;
  schema?: string;
  description?: string;
}

// Transformation result with metadata
export interface TransformationResult<T> {
  data: T;
  metadata: TransformationMetadata;
  warnings?: string[];
}

export interface TransformationMetadata {
  sourceFormat: string;
  targetFormat: string;
  transformerVersion: string;
  timestamp: Date;
  duration: number; // in milliseconds
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  qualityScore?: number; // 0-100
}

// Base abstract transformer class
export abstract class BaseTransformer<TSource, TTarget> implements DataTransformer<TSource, TTarget> {
  protected readonly name: string;
  protected readonly version: string;

  constructor(name: string, version: string) {
    this.name = name;
    this.version = version;
  }

  abstract transform(source: TSource, context?: TransformationContext): Promise<TTarget>;
  abstract validate(data: TSource): Promise<ValidationResult>;
  abstract getSupportedFormats(): TransformationFormat[];

  getVersion(): string {
    return this.version;
  }

  getName(): string {
    return this.name;
  }

  protected createTransformationStep(
    sourceFormat: string,
    targetFormat: string,
    context?: TransformationContext
  ): TransformationStep {
    return {
      transformer: this.name,
      timestamp: context?.timestamp || new Date(),
      sourceFormat,
      targetFormat,
      version: this.version,
    };
  }

  protected logTransformation(
    sourceFormat: string,
    targetFormat: string,
    context?: TransformationContext
  ): void {
    console.log(`[${this.name}] Transforming from ${sourceFormat} to ${targetFormat}`, {
      correlationId: context?.correlationId,
      timestamp: context?.timestamp,
    });
  }
}

// Abstract bidirectional transformer
export abstract class BaseBidirectionalTransformer<TExternal, TCdm extends CDMEntity> 
  implements BidirectionalTransformer<TExternal, TCdm> {
  
  protected readonly name: string;
  protected readonly version: string;

  constructor(name: string, version: string) {
    this.name = name;
    this.version = version;
  }

  abstract toCDM(external: TExternal, context?: TransformationContext): Promise<TCdm>;
  abstract fromCDM(cdm: TCdm, context?: TransformationContext): Promise<TExternal>;
  abstract validateExternal(data: TExternal): Promise<ValidationResult>;
  abstract validateCDM(data: TCdm): Promise<ValidationResult>;
  abstract getSupportedFormats(): TransformationFormat[];

  getVersion(): string {
    return this.version;
  }

  getName(): string {
    return this.name;
  }

  protected logTransformation(
    sourceFormat: string,
    targetFormat: string,
    context?: TransformationContext
  ): void {
    console.log(`[${this.name}] Transforming from ${sourceFormat} to ${targetFormat}`, {
      correlationId: context?.correlationId,
      timestamp: context?.timestamp,
    });
  }

  protected addTransformationHistory(
    cdmEntity: TCdm,
    sourceFormat: string,
    targetFormat: string,
    context?: TransformationContext
  ): void {
    if (!cdmEntity.metadata.transformationHistory) {
      cdmEntity.metadata.transformationHistory = [];
    }

    cdmEntity.metadata.transformationHistory.push({
      transformer: this.name,
      timestamp: context?.timestamp || new Date(),
      sourceFormat,
      targetFormat,
      version: this.version,
    });
  }
}

// Registry for managing transformers
export class TransformerRegistry {
  private transformers: Map<string, DataTransformer<any, any>> = new Map();

  register<TSource, TTarget>(
    key: string,
    transformer: DataTransformer<TSource, TTarget>
  ): void {
    this.transformers.set(key, transformer);
  }

  get<TSource, TTarget>(key: string): DataTransformer<TSource, TTarget> | undefined {
    return this.transformers.get(key) as DataTransformer<TSource, TTarget>;
  }

  getAll(): Map<string, DataTransformer<any, any>> {
    return new Map(this.transformers);
  }

  getSupportedTransformations(): TransformationRoute[] {
    const routes: TransformationRoute[] = [];
    
    for (const [key, transformer] of this.transformers) {
      const formats = transformer.getSupportedFormats();
      for (const format of formats) {
        routes.push({
          transformerKey: key,
          transformerName: key,
          sourceFormat: format.name,
          targetFormat: 'CDM', // Assuming CDM as target
          version: transformer.getVersion(),
        });
      }
    }
    
    return routes;
  }
}

export interface TransformationRoute {
  transformerKey: string;
  transformerName: string;
  sourceFormat: string;
  targetFormat: string;
  version: string;
}

// Transformation pipeline for chaining transformers
export class TransformationPipeline {
  private steps: TransformationStep[] = [];

  addStep<TSource, TTarget>(
    transformer: DataTransformer<TSource, TTarget>,
    sourceFormat: string,
    targetFormat: string
  ): TransformationPipeline {
    this.steps.push({
      transformer: transformer.constructor.name,
      timestamp: new Date(),
      sourceFormat,
      targetFormat,
      version: transformer.getVersion(),
    });
    return this;
  }

  async execute<TInitial, TFinal>(
    initialData: TInitial,
    transformers: DataTransformer<any, any>[],
    context?: TransformationContext
  ): Promise<TransformationResult<TFinal>> {
    const startTime = Date.now();
    let currentData: any = initialData;
    const warnings: string[] = [];

    for (let i = 0; i < transformers.length; i++) {
      const transformer = transformers[i];
      
      try {
        const validation = await transformer.validate(currentData);
        if (!validation.isValid) {
          throw new Error(`Validation failed at step ${i + 1}: ${validation.errors.map(e => e.message).join(', ')}`);
        }

        if (validation.warnings.length > 0) {
          warnings.push(...validation.warnings.map(w => `Step ${i + 1}: ${w.message}`));
        }

        currentData = await transformer.transform(currentData, context);
      } catch (error) {
        throw new Error(`Transformation failed at step ${i + 1}: ${error.message}`);
      }
    }

    const endTime = Date.now();

    return {
      data: currentData as TFinal,
      metadata: {
        sourceFormat: this.steps[0]?.sourceFormat || 'unknown',
        targetFormat: this.steps[this.steps.length - 1]?.targetFormat || 'unknown',
        transformerVersion: 'pipeline-1.0',
        timestamp: context?.timestamp || new Date(),
        duration: endTime - startTime,
        recordsProcessed: 1,
        recordsSuccessful: 1,
        recordsFailed: 0,
      },
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  getSteps(): TransformationStep[] {
    return [...this.steps];
  }

  clear(): void {
    this.steps = [];
  }
}
