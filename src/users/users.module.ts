import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from '../auth/entities/user.entity';
import { PermissionsGuard } from './guards/permissions.guard';
import { FileUploadService } from '../common/services/file-upload.service';
import { EmailService } from '../common/services/email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    PermissionsGuard,
    FileUploadService,
    EmailService,
  ],
  exports: [UsersService, PermissionsGuard],
})
export class UsersModule {}
