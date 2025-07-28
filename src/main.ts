import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { UserSeeder } from './auth/seeders/user.seeder';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Run database seeders
  const userSeeder = app.get(UserSeeder);
  await userSeeder.seed();
  
  await app.listen(4000);
  console.log('ESB Server running on http://localhost:4000');
  console.log('Authentication endpoints:');
  console.log('- POST /auth/register - Register a new user');
  console.log('- POST /auth/login - Login with username/password');
  console.log('- GET /auth/profile - Get user profile (requires authentication)');
  console.log('- GET /health - Health check (public)');
  console.log('\nDefault admin credentials:');
  console.log('Username: admin');
  console.log('Password: Admin@123456');
}
bootstrap();