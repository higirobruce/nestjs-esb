export interface EsbMessage {
  id: string;
  correlationId?: string;
  source: string;
  destination?: string;
  messageType: string;
  payload: any;
  headers: Record<string, any>;
  timestamp: Date;
  priority: number;
  ttl?: number;
}

export interface RouteConfig {
  id: string;
  pattern: string;
  destinations: string[];
  transformations?: string[];
  conditions?: Record<string, any>;
}
