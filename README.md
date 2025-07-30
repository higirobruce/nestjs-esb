# NestJS Enterprise Service Bus (ESB)

A simple but scalable Enterprise Service Bus implementation using NestJS and PostgreSQL.

## Features

- **Service Registry**: Register, discover, and manage services
- **Client Registry**: Manage API clients with authentication and rate limiting
- **Message Routing**: Route messages based on patterns and conditions
- **Orchestration**: Define and execute complex workflows
- **Service Integration**: Direct HTTP calls to services without messaging
- **Canonical Data Model (CDM)**: Unified data transformation and mapping framework


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

5. **Service Integration Module**
   - Direct HTTP calls to registered services via service discovery
   - Standalone HTTP calls to external APIs
   - Comprehensive request/response logging and tracking
   - Intelligent retry mechanisms with exponential backoff
   - Real-time performance metrics and success rate statistics
   - Client authentication and authorization integration
   - Correlation ID tracking across service calls
   - Configurable timeouts and circuit breaker patterns

6. **Citizen Module** (Example Implementation)
   - Demonstrates service-to-CDM coupling
   - National Registry service integration
   - Automatic data transformation to canonical format
   - Standardized API endpoints for citizen data

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

### Running the Application

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## Testing Authentication System

Follow these steps to test the authentication system:

### 1. Start the Application
   Ensure the application is running at `http://localhost:4000`.
   
   ```bash
   npm run start:dev
   ```

### 2. Run the Authentication Tests

#### Bash Script

Run the `test-auth.sh` script, which installs `axios` temporarily and executes tests:
```bash
./test-auth.sh
```

#### Direct Execution

Alternatively, you can run the Node.js test directly after installing required dependencies:
```bash
npm install axios --no-save
node test-auth.js
```

### Test Coverage

The test script verifies the following authentication features:
- **Health Endpoint:** Public access verification
- **JWT Login:** Token generation and expiration verification
- **Profile Access:** Using JWT authentication
- **Service Registry Access:** With JWT tokens
- **API Key Authentication:** Secure API key retrieval and usage

### Issues Fixed
- **JWT Token Generation:** Resolved expiration settings conflict
- **Password Hashing:** Optimized to avoid unnecessary rehashing
- **API Key Exposure:** Secured key retrieval

The authentication system should now be fully operational and secure.

## Authentication

The ESB now includes a comprehensive authentication system with:

- **JWT-based authentication** for web clients
- **API Key authentication** for service-to-service communication
- **Role-based access control** (RBAC)
- **Account security features** (password policies, account locking, etc.)
- **Multiple authentication strategies** (flexible auth)

### Authentication Roles

- **ADMIN**: Full system access, user management
- **USER**: Standard user access
- **SERVICE**: Service-to-service communication
- **READONLY**: Read-only access to resources

### Default Admin Account

A default admin account is created on first startup:
- **Username**: `admin`
- **Email**: `admin@esb.local`
- **Password**: `Admin@123456`
- ⚠️ **Important**: Change the default password after first login!

## API Documentation

### Authentication Endpoints

#### Register a New User
```http
POST /auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass@123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "SecurePass@123"
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "status": "active"
  },
  "expiresIn": 3600
}
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Get User Profile
```http
GET /auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Change Password
```http
POST /auth/change-password
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "currentPassword": "SecurePass@123",
  "newPassword": "NewSecurePass@456"
}
```

#### Generate API Key
```http
POST /auth/generate-api-key
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "description": "API key for my service"
}
```

Response:
```json
{
  "apiKey": "a1b2c3d4e5f6...",
  "message": "API key generated successfully. Please store it securely as it cannot be retrieved again."
}
```

#### Forgot Password
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### Reset Password
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePass@456"
}
```

### Authentication Methods

#### JWT Bearer Token
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### API Key (Header)
```http
X-API-Key: your-api-key-here
```

#### API Key (Authorization Header)
```http
Authorization: ApiKey your-api-key-here
```

#### API Key (Query Parameter)
```http
GET /services?api_key=your-api-key-here
```

### Admin Endpoints

#### Get All Users (Admin Only)
```http
GET /auth/users
Authorization: Bearer admin-jwt-token
```

#### Update User (Admin Only)
```http
PUT /auth/users/{userId}
Authorization: Bearer admin-jwt-token
Content-Type: application/json

{
  "role": "service",
  "status": "active"
}
```

#### Delete User (Admin Only)
```http
DELETE /auth/users/{userId}
Authorization: Bearer admin-jwt-token
```

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

### Service Integration (Direct HTTP Calls)

The Service Integration module provides two primary methods for making HTTP calls:

1. **Service-based calls**: Calls to services registered in the service registry
2. **Direct calls**: Direct HTTP calls to any URL

#### Call Registered Service

This endpoint automatically resolves the service endpoint from the service registry and makes the call:

```http
POST /integration/call-service
Content-Type: application/json

{
  "serviceName": "user-service",
  "serviceVersion": "1.0.0",
  "method": "POST",
  "path": "/users",
  "correlationId": "req-123",
  "clientId": "mobile-app-client",
  "headers": {
    "Authorization": "Bearer token123"
  },
  "body": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "maxRetries": 3,
  "timeoutMs": 30000
}
```

**Features:**
- Automatic service endpoint resolution
- Service version targeting
- Client validation and authorization

#### Direct HTTP Call

This endpoint allows direct HTTP calls to any URL without service registry lookup:

```http
POST /integration/direct-call
Content-Type: application/json

{
  "url": "https://api.example.com/users",
  "method": "GET",
  "correlationId": "req-124",
  "headers": {
    "Authorization": "Bearer token123"
  },
  "queryParams": {
    "limit": "10",
    "offset": "0"
  },
  "maxRetries": 2,
  "timeoutMs": 15000
}
```

**Features:**
- Direct URL targeting
- Support for all HTTP methods (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- Query parameter handling
- Custom header support

#### Get Service Call Details
```http
GET /integration/calls/{call-id}
```

#### Get Service Call History
```http
GET /integration/calls?correlationId=req-123&serviceName=user-service
```

#### Get Service Call Statistics
```http
GET /integration/stats?serviceName=user-service
```

Response:
```json
{
  "totalCalls": 150,
  "successCalls": 142,
  "failedCalls": 8,
  "successRate": 94.67,
  "avgExecutionTimeMs": 1250
}
```

### Citizens (Service-CDM Integration Example)

The Citizens module demonstrates how to couple an external service with the CDM transformation engine. This serves as a practical example of the adapter/facade pattern to create a 360-degree view of a citizen.

#### Get Comprehensive Citizen Profile (360-Degree View)

This endpoint orchestrates calls to multiple backend services (e.g., National Registry, DMV, Document Service) to aggregate a complete citizen profile.

```http
GET /citizens/{nationalId}/profile
Authorization: Bearer jwt-token
```

Example Response:
```json
{
  "citizen": {
    "id": "national-registry-19900515-1234",
    "firstName": "Jane",
    "lastName": "Doe",
    ...
  },
  "vehicles": [
    {
      "vin": "123-ABC-789",
      "licensePlate": "NATION-01",
      "make": "GovernmentMotors",
      "model": "OfficialSedan",
      "year": 2024
    }
  ],
  "documents": [
    {
      "documentId": "P12345678",
      "documentType": "Passport",
      "issuingAuthority": "Department of State",
      "expirationDate": "2030-10-15T00:00:00.000Z"
    }
  ]
}
```

#### Register the National Registry Service

First, register the external service in the service registry:

```http
POST /services
Content-Type: application/json

{
  "name": "national-registry-service",
  "version": "1.0.0",
  "endpoint": "https://api.nationalregistry.gov",
  "healthCheck": {
    "url": "https://api.nationalregistry.gov/health",
    "interval": 30000,
    "timeout": 5000
  }
}
```

#### Get Citizen by National ID

```http
GET /citizens/{nationalId}
Authorization: Bearer jwt-token
```

Example:
```http
GET /citizens/19900515-1234
```

Response (in standardized CitizenCDM format):
```json
{
  "id": "national-registry-19900515-1234",
  "firstName": "Jane",
  "lastName": "Doe",
  "dateOfBirth": "1990-05-15T00:00:00.000Z",
  "gender": "female",
  "nationality": "Nationlander",
  "addresses": [
    {
      "type": "home",
      "line1": "123 Government Ave",
      "city": "Capital City",
      "postalCode": "10001",
      "country": "Nationland",
      "isPrimary": true
    }
  ],
  "contactInfo": [
    {
      "type": "email",
      "value": "jane.doe@example.com",
      "isPrimary": true
    }
  ],
  "metadata": {
    "sourceSystem": "national-registry",
    "sourceId": "19900515-1234",
    "transformationHistory": [...]
  }
}
```

#### Search Citizens

```http
POST /citizens/search
Content-Type: application/json
Authorization: Bearer jwt-token

{
  "givenName": "Jane",
  "familyName": "Doe",
  "limit": 10,
  "offset": 0
}
```

#### Update Citizen Information

```http
PUT /citizens/{nationalId}
Content-Type: application/json
Authorization: Bearer jwt-token

{
  "firstName": "Jane",
  "lastName": "Smith",
  "contactInfo": [
    {
      "type": "email",
      "value": "jane.smith@example.com",
      "isPrimary": true
    }
  ]
}
```

#### Test Transformation (Development)

```http
GET /citizens/mock/transform
```

This endpoint demonstrates the transformation using mock data without calling external services.

### Service Integration Features

#### Retry Logic
- **Intelligent Retry**: Only retries on retryable errors (5xx, network errors, 408, 429)
- **Exponential Backoff**: Delays between retries increase exponentially (max 10 seconds)
- **Configurable Retries**: Up to 10 retry attempts per call
- **Retry Tracking**: Each retry attempt is logged and tracked

#### Error Handling
- **Status Tracking**: All calls are tracked with status (pending, success, failed, timeout, cancelled)
- **Error Categorization**: Distinguishes between client errors (4xx) and server errors (5xx)
- **Detailed Logging**: Complete request/response details stored for debugging
- **Event Emission**: Success and error events emitted for monitoring

#### Performance Monitoring
- **Execution Time Tracking**: Millisecond-precision timing for all calls
- **Success Rate Calculation**: Real-time success rate statistics
- **Call History**: Complete audit trail of all service interactions
- **Correlation Tracking**: End-to-end request tracing with correlation IDs

#### Security Features
- **Client Validation**: Optional client ID validation against client registry
- **Header Passthrough**: Custom authentication headers supported
- **Request Sanitization**: Safe handling of request/response data
- **Audit Trail**: Complete logging for security and compliance

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

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRATION_TIME=3600
JWT_REFRESH_EXPIRATION_TIME=604800

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:4000
CORS_CREDENTIALS=true
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


## Canonical Data Model (CDM)

This ESB includes a powerful Canonical Data Model (CDM) to standardize data across different systems and formats. The CDM provides a unified structure for common business entities like citizens, ensuring data consistency and simplifying transformations between government agencies.

### Key Components

- **Core Types**: Foundational data structures for metadata, addresses, contact info, and more. Located in `src/canonical-data-model/types`.
- **Schemas**: Concrete definitions for canonical models like `CitizenCDM`, `VehicleCDM`, `OfficialDocumentCDM`, and `PropertyCDM`. Located in `src/canonical-data-model/schemas`.
- **Transformers**: Classes to convert data between external formats (e.g., a National Population Registry) and the CDM. Located in `src/canonical-data-model/transformers`.
- **Validators**: Tools to ensure data integrity against the CDM schemas. Located in `src/canonical-data-model/validators`.

### How to Use the CDM: A Government Context Example

Here’s a practical example of how to use the CDM to transform citizen data from a hypothetical National Registry into the canonical format.

#### 1. Import Necessary Components

```typescript
// This is a conceptual example. The actual transformer would need to be created.
import {
  NationalRegistryCitizenTransformer,
  NationalRegistryCitizen,
} from 'src/canonical-data-model/transformers/national-registry-citizen.transformer';
import { CitizenCDM } from 'src/canonical-data-model/schemas/citizen.schema';
import { TransformationContext } from 'src/canonical-data-model/transformers/base.transformer';
import { CDMValidatorFactory } from 'src/canonical-data-model/validators/cdm.validator';
```

#### 2. Prepare Your Source Data

This is a simplified example of a citizen data object from a National Registry system.

```typescript
const citizenData: NationalRegistryCitizen = {
  NationalID: '19900515-1234',
  GivenName: 'Jane',
  FamilyName: 'Doe',
  DateOfBirth: '1990-05-15',
  Gender: 'Female',
  ResidentialAddress: '123 Government Ave, Capital City, Nationland',
  PostalCode: '10001',
  CountryOfBirth: 'Nationland',
  Nationality: 'Nationlander',
  RegistrationDate: new Date().toISOString(),
  LastUpdateDate: new Date().toISOString(),
  ResidencyStatus: 'Permanent Resident',
};
```

#### 3. Transform the Data to CDM

Instantiate the transformer and call the `toCDM` method. The transformer would map fields like `GivenName` to `firstName` and `ResidentialAddress` to the canonical `Address` structure.

```typescript
async function transformData() {
  const transformer = new NationalRegistryCitizenTransformer();

  const context: TransformationContext = {
    sourceSystem: 'NationalPopulationRegistry',
    correlationId: 'req-abc-987',
    timestamp: new Date(),
  };

  try {
    const cdmCitizen: CitizenCDM = await transformer.toCDM(citizenData, context);
    console.log('Successfully transformed to CDM:', cdmCitizen);
    return cdmCitizen;
  } catch (error) {
    console.error('Transformation failed:', error);
  }
}
```

#### 4. Validate the Canonical Data

After transformation, use the CDM validator to ensure data integrity, such as checking for a valid National ID format or a complete address.

```typescript
async function validateCDM(cdmCitizen: CitizenCDM) {
  const validator = CDMValidatorFactory.createValidator('citizen');
  const validationResult = await validator.validate(cdmCitizen);

  if (validationResult.isValid) {
    console.log('CDM data is valid.');
  } else {
    console.error('CDM data is invalid:', validationResult.errors);
  }
}
```

By leveraging the CDM, government agencies can create a robust and maintainable integration architecture that decouples systems and standardizes data exchange for improved public services.

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
