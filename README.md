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

- Node.js 18+ (for local development)
- Docker and Docker Compose (recommended)
- PostgreSQL 12+ (if running locally without Docker)
- npm or yarn (for local development)

### Option 1: Docker Deployment (Recommended)

#### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd nestjs-esb

# Copy environment template
cp .env.example .env

# Start the application with Docker Compose
docker-compose up --build
```

The application will be available at:
- **ESB API**: http://localhost:4000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

#### Development with Docker

```bash
# Start development environment with hot reloading
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Additional services available:
# - Database Admin (Adminer): http://localhost:8080
# - Debug port: 9229
```

#### Production with Docker

```bash
# Start production environment
docker-compose up --build -d

# With Nginx reverse proxy (optional)
docker-compose --profile production up --build -d
```

### Option 2: Local Development

#### Installation

```bash
npm install
```

#### Environment Variables

Create a `.env` file:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=esb_db
NODE_ENV=development
```

#### Database Setup

```sql
CREATE DATABASE esb_db;
```

#### Running the Application

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

## Docker Infrastructure

### Services Included

1. **NestJS ESB Application**
   - Multi-stage Docker build for production optimization
   - Health checks and graceful shutdown
   - Non-root user for security
   - Hot reloading in development mode

2. **PostgreSQL Database**
   - Version 15 Alpine for smaller footprint
   - Persistent data volumes
   - Automatic database initialization
   - Health checks and connection pooling

3. **Redis Cache**
   - Used for rate limiting and caching
   - Persistent data storage
   - Health monitoring

4. **Nginx Reverse Proxy** (Production Profile)
   - Load balancing and SSL termination
   - Rate limiting and security headers
   - Static file serving
   - Production-ready configuration

5. **Adminer** (Development Only)
   - Web-based database management
   - Available at http://localhost:8080

### Docker Commands

```bash
# Build and start all services
docker-compose up --build

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop all services
docker-compose down

# Remove volumes (caution: deletes data)
docker-compose down -v

# Scale the application (horizontal scaling)
docker-compose up --scale app=3
```

### Environment Configuration

The application uses environment variables for configuration. Copy `.env.example` to `.env` and modify as needed:

```env
# Database Configuration
DB_HOST=db
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-secure-password
DB_NAME=esb_db

# Application Configuration
NODE_ENV=production
PORT=4000

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# Additional configurations...
```

### Production Deployment

For production deployment:

1. **Update environment variables** in `.env` with secure values
2. **Enable Nginx profile** for reverse proxy:
   ```bash
   docker-compose --profile production up -d
   ```
3. **Configure SSL certificates** in the `ssl/` directory
4. **Set up monitoring** and log aggregation
5. **Configure backup** for PostgreSQL data volumes

### Health Checks

All services include health checks:
- **Application**: HTTP endpoint at `/health`
- **PostgreSQL**: Connection test with `pg_isready`
- **Redis**: Ping command
- **Nginx**: Service availability check

## Production Considerations

1. **Security**: Implement proper authentication and authorization
2. **Monitoring**: Add metrics, logging, and alerting
3. **Performance**: Implement caching and connection pooling
4. **Reliability**: Add circuit breakers and bulkhead patterns
5. **Testing**: Add comprehensive unit and integration tests
6. **Documentation**: API documentation with Swagger/OpenAPI
7. **Container Security**: Regular image updates and vulnerability scanning
8. **Backup Strategy**: Automated database backups and disaster recovery
9. **Load Balancing**: Horizontal scaling with multiple application instances
10. **SSL/TLS**: Proper certificate management and HTTPS enforcement
