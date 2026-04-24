import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserRole } from './user.entity';

@Entity('role_permissions')
@Index(['role', 'module'], { unique: true }) // Un registro único por rol/módulo
export class RolePermission extends BaseEntity {
  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @Column({ length: 50 })
  module: string; // 'agents', 'integrations', 'channels', etc.

  @Column({ name: 'can_view', default: false })
  canView: boolean;

  @Column({ name: 'can_create', default: false })
  canCreate: boolean;

  @Column({ name: 'can_edit', default: false })
  canEdit: boolean;

  @Column({ name: 'can_delete', default: false })
  canDelete: boolean;

  @Column({ nullable: true, length: 500 })
  description: string; // Descripción del permiso

  @Column({ name: 'is_active', default: true })
  isActive: boolean; // Para activar/desactivar permisos

  @Column({ name: 'created_by', nullable: true })
  createdBy: string; // Usuario que creó el permiso

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string; // Usuario que actualizó el permiso
}