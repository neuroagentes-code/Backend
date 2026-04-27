import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { RolePermission } from './role-permission.entity';
import { User } from './user.entity';

@Entity('user_permission_overrides')
export class UserPermissionOverride extends BaseEntity {
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => RolePermission, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_permission_id' })
  rolePermission: RolePermission;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}