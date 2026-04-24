import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from '../auth/entities/user.entity';
import { RolePermission } from '../auth/entities/role-permission.entity';
import { PermissionsGuard } from './guards/permissions.guard';
import { FileUploadService } from '../common/services/file-upload.service';
import { EmailService } from '../common/services/email.service';
import { RolePermissionsService } from '../common/services/role-permissions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RolePermission]),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    PermissionsGuard,
    FileUploadService,
    EmailService,
    RolePermissionsService,
  ],
  exports: [UsersService, PermissionsGuard, FileUploadService, RolePermissionsService],
})
export class UsersModule {}
