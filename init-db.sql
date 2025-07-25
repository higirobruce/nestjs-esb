-- Initialize ESB Database
-- This script will be executed when the PostgreSQL container starts for the first time

-- Create database if it doesn't exist (this is handled by POSTGRES_DB env var)
-- The database 'esb_db' will be created automatically

-- Set up basic configuration
ALTER DATABASE esb_db SET timezone TO 'UTC';

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- You can add any initial data or additional configuration here
-- Tables will be auto-created by TypeORM when the application starts

-- Example: Create a default admin user or initial configuration
-- This is just a placeholder - actual table creation is handled by TypeORM
