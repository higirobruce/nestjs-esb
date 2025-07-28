import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../entities/user.entity';

@Injectable()
export class UserSeeder {
  private readonly logger = new Logger(UserSeeder.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async seed(): Promise<void> {
    const adminExists = await this.userRepository.findOne({
      where: { role: UserRole.ADMIN },
    });

    if (adminExists) {
      this.logger.log('Admin user already exists');
      return;
    }

    // Create default admin user
    const adminUser = this.userRepository.create({
      username: 'admin',
      email: 'admin@esb.local',
      password: 'Admin@123456', // This will be hashed by the entity
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    });

    // Generate API key
    adminUser.generateApiKey();

    await this.userRepository.save(adminUser);

    this.logger.log('Default admin user created:');
    this.logger.log(`Username: admin`);
    this.logger.log(`Email: admin@esb.local`);
    this.logger.log(`Password: Admin@123456`);
    this.logger.log(`API Key: ${adminUser.apiKey}`);
    this.logger.warn('Please change the default admin password after first login!');
  }
}
