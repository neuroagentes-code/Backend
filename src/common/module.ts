import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolePermissionsController } from './controllers/role-permissions.controller';
import { RolePermissionsService } from './services/role-permissions.service';
import { RolePermission } from '../auth/entities/role-permission.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([RolePermission]), UsersModule],
  controllers: [RolePermissionsController],
  providers: [RolePermissionsService],
  exports: [RolePermissionsService],
})
export class RolePermissionsModule {}