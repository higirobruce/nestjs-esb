# NestJS Enterprise Service Bus (ESB)

A simple but scalable Enterprise Service Bus implementation using NestJS and PostgreSQL.

## Features

- **Service Registry**: Register, discover, and manage services
- **Client Registry**: Manage API clients with authentication and rate limiting
- **Message Routing**: Route messages based on patterns and conditions
- **Orchestration**: Define and execute complex workflows

## Architecture

### Modules

1. **Service Registry Module**
   - Service registration and discovery
   - Health check monitoring
   - Service lifecycle management

2. **Client Registry Module**
   - Client authentication via API keys
   - Service access control
   - Rate limiting configuration

3. **Message Routing Module**
   - Pattern-based message routing
   - Conditional routing
   - Message transformation
   - Message logging and tracking

4. **Orchestration Module**
   - Workflow definition and execution
   - Step-by-step process orchestration
   - Error handling and retry policies
   - Parallel and conditional execution

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=esb_db
NODE_ENV=development
```

### Database Setup

```sql
CREATE DATABASE esb_db;
```

### Running the Application

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Documentation

### Service Registry

#### Register a Service
```http
POST /services
Content-Type: application/json

{
  "name": "user-service",
  "version": "1.0.0",
  "endpoint": "http://localhost:3001",
  "healthCheck": {
    "url": "http://localhost:3001/health",
    "interval": 30000,
    "timeout": 5000
  }
}
```

#### Get All Services
```http
GET /services
```

#### Update Service Status
```http
PATCH /services/{id}/status
Content-Type: application/json

{
  "status": "maintenance"
}
```

### Client Registry

#### Register a Client
```http
POST /clients
Content-Type: application/json

{
  "name": "mobile-app",
  "allowedServices": ["user-service", "order-service"],
  "rateLimits": {
    "requestsPerMinute": 100,
    "requestsPerHour": 1000
  }
}
```

#### Get All Clients
```http
GET /clients
```

### Message Routing

#### Create a Route
```http
POST /routing/routes
Content-Type: application/json

{
  "name": "user-events",
  "pattern": "user.*",
  "destinations": ["user-service", "analytics-service"],
  "conditions": {
    "header.eventType": "user.created"
  }
}
```

#### Send a Message
```http
POST /routing/send
Content-Type: application/json

{
  "source": "api-gateway",
  "messageType": "user.created",
  "payload": {
    "userId": "123",
    "email": "user@example.com"
  },
  "headers": {
    "eventType": "user.created"
  }
}
```

#### Get Message Logs
```http
GET /routing/logs?correlationId=abc-123
```

### Orchestration

#### Create a Workflow
```http
POST /orchestration/workflows
Content-Type: application/json

{
  "name": "user-onboarding",
  "version": "1.0.0",
  "description": "Complete user onboarding process",
  "definition": {
    "steps": [
      {
        "id": "create-user",
        "name": "Create User Account",
        "type": "service_call",
        "config": {
          "serviceName": "user-service",
          "method": "createUser",
          "payload": {
            "email": "${email}",
            "name": "${name}"
          }
        },
        "onSuccess": "send-welcome-email"
      },
      {
        "id": "send-welcome-email",
        "name": "Send Welcome Email",
        "type": "service_call",
        "config": {
          "serviceName": "email-service",
          "method": "sendWelcomeEmail",
          "payload": {
            "userId": "${userId}",
            "email": "${email}"
          }
        }
      }
    ],
    "variables": {},
    "errorHandling": {
      "retryPolicy": {
        "maxRetries": 3,
        "backoffStrategy": "exponential",
        "initialDelay": 1000,
        "maxDelay": 10000
      },
      "onError": "log-error"
    }
  }
}
```

#### Execute a Workflow
```http
POST /orchestration/execute
Content-Type: application/json

{
  "workflowId": "workflow-uuid",
  "initialContext": {
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

## Scalability Features

1. **Database Connection Pooling**: Configured through TypeORM
2. **Event-Driven Architecture**: Using NestJS EventEmitter
3. **Async Processing**: Non-blocking workflow execution
4. **Modular Design**: Easy to extend and modify
5. **Message Correlation**: Track messages across services
6. **Retry Policies**: Configurable retry mechanisms
7. **Health Monitoring**: Service health checks

## Extension Points

1. **Custom Transformations**: Add new message transformation types
2. **Step Types**: Create new workflow step types
3. **Routing Strategies**: Implement custom routing algorithms
4. **Authentication**: Add different auth mechanisms
5. **Monitoring**: Integrate with monitoring systems
6. **Message Queues**: Add support for external message brokers

## Production Considerations

1. **Security**: Implement proper authentication and authorization
2. **Monitoring**: Add metrics, logging, and alerting
3. **Performance**: Implement caching and connection pooling
4. **Reliability**: Add circuit breakers and bulkhead patterns
5. **Testing**: Add comprehensive unit and integration tests
6. **Documentation**: API documentation with Swagger/OpenAPI