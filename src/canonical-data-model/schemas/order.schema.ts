/**
 * Order Canonical Data Model
 * Represents a unified order entity for e-commerce and transaction processing
 */

import {
  CDMEntity,
  Address,
  Money,
  ExternalIdentifier,
  EntityStatus,
  CustomAttribute,
  EntityRelationship,
  DataQuality,
  AuditTrail,
  DateRange,
} from '../types/core.types';

export interface OrderCDM extends CDMEntity {
  // Core order identification
  orderNumber: string;
  customerCode: string;
  customerId: string;
  
  // Order dates
  orderDate: Date;
  requestedDeliveryDate?: Date;
  confirmedDeliveryDate?: Date;
  shippedDate?: Date;
  deliveredDate?: Date;
  cancelledDate?: Date;
  
  // Financial details
  subtotal: Money;
  taxAmount: Money;
  shippingAmount: Money;
  discountAmount: Money;
  totalAmount: Money;
  paidAmount: Money;
  refundAmount: Money;
  
  // Order status and workflow
  status: EntityStatus;
  orderType: 'standard' | 'express' | 'backorder' | 'preorder';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // Addresses
  billingAddress: Address;
  shippingAddress: Address;
  
  // Line items
  lineItems: OrderLineItem[];
  
  // Shipping and fulfillment
  shippingMethod: ShippingMethod;
  trackingNumbers: string[];
  fulfillmentCenter?: string;
  
  // Payment information
  paymentMethods: PaymentMethod[];
  
  // External system identifiers
  externalIdentifiers: ExternalIdentifier[];
  
  // Order source and channel
  sourceChannel: 'web' | 'mobile' | 'phone' | 'email' | 'store' | 'partner';
  sourceSystem: string;
  salesPerson?: string;
  
  // Special instructions and notes
  customerNotes?: string;
  internalNotes?: string;
  specialInstructions?: string;
  
  // Relationships to other entities
  relationships: EntityRelationship[];
  
  // Custom attributes for extensibility
  customAttributes: CustomAttribute[];
  
  // Data quality metrics
  dataQuality: DataQuality;
  
  // Audit trail
  auditTrail: AuditTrail[];
}

export interface OrderLineItem {
  id: string;
  lineNumber: number;
  productCode: string;
  productName: string;
  productVariant?: string;
  sku: string;
  quantity: number;
  unitPrice: Money;
  lineTotal: Money;
  discount: Money;
  tax: Money;
  
  // Product details
  category?: string;
  brand?: string;
  weight?: number;
  dimensions?: ProductDimensions;
  
  // Fulfillment
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  shippedQuantity?: number;
  deliveredQuantity?: number;
  returnedQuantity?: number;
  
  // Special attributes
  isGift: boolean;
  giftMessage?: string;
  customization?: Record<string, any>;
  
  // External identifiers
  externalIdentifiers: ExternalIdentifier[];
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in' | 'mm';
}

export interface ShippingMethod {
  code: string;
  name: string;
  carrier: string;
  serviceLevel: 'standard' | 'expedited' | 'overnight' | 'same-day';
  estimatedDeliveryTime: DateRange;
  cost: Money;
  trackingAvailable: boolean;
}

export interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' | 'cash' | 'check' | 'gift_card' | 'store_credit';
  status: 'pending' | 'authorized' | 'captured' | 'failed' | 'cancelled' | 'refunded';
  amount: Money;
  
  // Card details (if applicable)
  cardType?: 'visa' | 'mastercard' | 'amex' | 'discover';
  lastFourDigits?: string;
  expiryDate?: string;
  
  // Transaction details
  authorizationCode?: string;
  transactionId?: string;
  gatewayResponse?: string;
  processedDate?: Date;
  
  // External identifiers
  externalIdentifiers: ExternalIdentifier[];
}

// Order lifecycle stages
export enum OrderLifecycleStage {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
  REFUNDED = 'refunded'
}

// Extended order model with business analytics
export interface EnhancedOrderCDM extends OrderCDM {
  lifecycleStage: OrderLifecycleStage;
  
  // Business metrics
  profitMargin?: number;
  customerAcquisitionCost?: Money;
  customerLifetimeValue?: Money;
  
  // Risk assessment
  fraudRiskScore?: number; // 0-100
  creditRiskScore?: number; // 0-100
  
  // Marketing attribution
  campaignId?: string;
  referralSource?: string;
  couponCodes?: string[];
  
  // Service level agreements
  slaViolations?: SLAViolation[];
  performanceMetrics?: OrderPerformanceMetrics;
}

export interface SLAViolation {
  type: 'delivery' | 'processing' | 'response';
  expectedDate: Date;
  actualDate: Date;
  impact: 'low' | 'medium' | 'high' | 'critical';
  reason?: string;
}

export interface OrderPerformanceMetrics {
  processingTime: number; // in hours
  fulfillmentTime: number; // in hours
  deliveryTime: number; // in hours
  customerSatisfactionScore?: number; // 1-10
}
