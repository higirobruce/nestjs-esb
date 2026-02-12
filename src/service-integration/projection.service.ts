import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ServiceRegistryService } from '../service-registry/service-registry.service';
import { ClientRegistryService } from '../client-registry/client-registry.service';
import { ResponseProjectionDto } from './dto/projection.dto';

@Injectable()
export class ProjectionService {
  private readonly logger = new Logger(ProjectionService.name);

  constructor(
    private serviceRegistry: ServiceRegistryService,
    private clientRegistry: ClientRegistryService,
  ) {}

  /**
   * Determine which projection to apply based on priority:
   * 1. Per-call explicit projection
   * 2. Client default for this service
   * 3. No projection (return full response)
   */
  async resolveProjection(
    serviceName: string,
    clientId?: string,
    requestedProjection?: ResponseProjectionDto,
  ): Promise<string[] | null> {
    // Priority 1: Explicit per-call projection
    if (requestedProjection) {
      if (requestedProjection.mode === 'preset' && requestedProjection.preset) {
        this.logger.debug(
          `Resolving preset '${requestedProjection.preset}' for service '${serviceName}'`,
        );
        return this.resolvePreset(serviceName, requestedProjection.preset);
      } else if (requestedProjection.fields && requestedProjection.fields.length > 0) {
        this.logger.debug(
          `Using explicit field list with ${requestedProjection.fields.length} fields`,
        );
        return requestedProjection.fields;
      }
    }

    // Priority 2: Client default for this service
    if (clientId) {
      const clientProjection = await this.getClientDefaultProjection(
        clientId,
        serviceName,
      );
      if (clientProjection) {
        this.logger.debug(
          `Using client default projection for service '${serviceName}'`,
        );
        return clientProjection;
      }
    }

    // Priority 3: No projection
    this.logger.debug('No projection configured, returning full response');
    return null;
  }

  /**
   * Resolve preset name to field list
   */
  async resolvePreset(
    serviceName: string,
    presetName: string,
  ): Promise<string[]> {
    const services = await this.serviceRegistry.getServicesByName(serviceName);

    if (!services || services.length === 0) {
      throw new BadRequestException(
        `Service '${serviceName}' not found`,
      );
    }

    // Use the first active service (could be enhanced to use version)
    const service = services.find(s => s.status === 'active') || services[0];

    if (!service?.projectionPresets || !service.projectionPresets[presetName]) {
      throw new BadRequestException(
        `Projection preset '${presetName}' not found for service '${serviceName}'. ` +
        `Available presets: ${service?.projectionPresets ? Object.keys(service.projectionPresets).join(', ') : 'none'}`,
      );
    }

    const fields = service.projectionPresets[presetName];
    this.logger.debug(
      `Resolved preset '${presetName}' to ${fields.length} fields: ${fields.join(', ')}`,
    );
    return fields;
  }

  /**
   * Validate requested fields against service response schema
   */
  async validateProjection(
    serviceName: string,
    fields: string[],
  ): Promise<void> {
    const services = await this.serviceRegistry.getServicesByName(serviceName);

    if (!services || services.length === 0) {
      this.logger.warn(
        `Service '${serviceName}' not found, skipping validation`,
      );
      return;
    }

    const service = services.find(s => s.status === 'active') || services[0];

    if (!service?.contractConfig?.responseSchema) {
      this.logger.warn(
        `No response schema defined for service '${serviceName}', skipping validation`,
      );
      return;
    }

    const schema = service.contractConfig.responseSchema;
    const schemaFields = this.extractSchemaFields(schema);
    const invalidFields = this.findInvalidFields(fields, schemaFields);

    if (invalidFields.length > 0) {
      throw new BadRequestException(
        `Invalid projection fields for service '${serviceName}': ${invalidFields.join(', ')}. ` +
        `These fields are not in the service response schema.`,
      );
    }

    this.logger.debug(
      `Validated ${fields.length} projection fields against schema`,
    );
  }

  /**
   * Apply projection to response data
   */
  applyProjection(data: any, fields: string[]): any {
    if (!data || !fields || fields.length === 0) {
      return data;
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map((item) => this.applyProjection(item, fields));
    }

    // Handle objects
    if (typeof data === 'object' && data !== null) {
      return this.projectObject(data, fields);
    }

    // Primitives return as-is
    return data;
  }

  /**
   * Project a single object
   */
  private projectObject(obj: any, fields: string[]): any {
    const result: any = {};

    for (const field of fields) {
      if (field.includes('*')) {
        // Wildcard: 'user.*'
        this.expandWildcard(result, obj, field);
      } else if (field.includes('.')) {
        // Nested field: 'user.email'
        const value = this.getNestedField(obj, field);
        if (value !== undefined) {
          this.setNestedField(result, field, value);
        }
      } else {
        // Simple field: 'id'
        if (obj.hasOwnProperty(field)) {
          result[field] = obj[field];
        }
      }
    }

    return result;
  }

  /**
   * Get nested field value using dot notation
   */
  private getNestedField(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Set nested field value using dot notation
   */
  private setNestedField(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }

    const lastPart = parts[parts.length - 1];
    if (value !== undefined) {
      current[lastPart] = value;
    }
  }

  /**
   * Expand wildcard fields like 'user.*'
   */
  private expandWildcard(result: any, obj: any, pattern: string): void {
    if (pattern === '*') {
      // Top-level wildcard '*' - copy all fields
      Object.assign(result, obj);
      return;
    }

    const [prefix] = pattern.split('*');
    const basePath = prefix.replace(/\.$/, '');

    if (!basePath) {
      // Pattern is just '*' at root level
      Object.assign(result, obj);
      return;
    }

    const baseObj = this.getNestedField(obj, basePath);

    if (baseObj && typeof baseObj === 'object' && !Array.isArray(baseObj)) {
      // Create the nested structure and copy all fields
      const existingNested = this.getNestedField(result, basePath) || {};
      const merged = { ...existingNested, ...baseObj };
      this.setNestedField(result, basePath, merged);
    }
  }

  /**
   * Find fields that don't exist in schema
   */
  private findInvalidFields(fields: string[], schemaFields: Set<string>): string[] {
    const invalid: string[] = [];

    for (const field of fields) {
      // Skip wildcard fields - they're validated at runtime
      if (field.includes('*')) {
        continue;
      }

      const cleanField = field.replace(/\.\*$/, ''); // Remove trailing wildcard
      if (!this.isValidField(cleanField, schemaFields)) {
        invalid.push(field);
      }
    }

    return invalid;
  }

  /**
   * Extract all valid field paths from schema
   */
  private extractSchemaFields(schema: any, prefix = ''): Set<string> {
    const fields = new Set<string>();

    if (!schema || typeof schema !== 'object') {
      return fields;
    }

    // Handle JSON Schema format
    if (schema.properties) {
      for (const [key, value] of Object.entries(schema.properties)) {
        const path = prefix ? `${prefix}.${key}` : key;
        fields.add(path);

        if (value && typeof value === 'object') {
          // Recursively extract nested fields
          const nested = this.extractSchemaFields(value, path);
          nested.forEach((f) => fields.add(f));
        }
      }
    }

    // Handle plain object schemas (non-JSON Schema)
    if (!schema.properties && typeof schema === 'object') {
      for (const [key, value] of Object.entries(schema)) {
        const path = prefix ? `${prefix}.${key}` : key;
        fields.add(path);

        if (value && typeof value === 'object' && !Array.isArray(value)) {
          const nested = this.extractSchemaFields(value, path);
          nested.forEach((f) => fields.add(f));
        }
      }
    }

    return fields;
  }

  /**
   * Check if field path is valid
   */
  private isValidField(field: string, validFields: Set<string>): boolean {
    // Exact match
    if (validFields.has(field)) {
      return true;
    }

    // Check if it's a prefix of a valid field (for nested objects)
    for (const validField of validFields) {
      if (validField.startsWith(field + '.')) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get client's default projection for a service
   */
  private async getClientDefaultProjection(
    clientId: string,
    serviceName: string,
  ): Promise<string[] | null> {
    try {
      const client = await this.clientRegistry.getClient(clientId);

      if (!client?.defaultProjections || !client.defaultProjections[serviceName]) {
        return null;
      }

      const config = client.defaultProjections[serviceName];

      if (config.preset) {
        return this.resolvePreset(serviceName, config.preset);
      }

      return config.fields || null;
    } catch (error) {
      this.logger.warn(
        `Failed to get client default projection: ${error.message}`,
      );
      return null;
    }
  }
}
