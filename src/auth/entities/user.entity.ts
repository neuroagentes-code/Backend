import { Entity, Column, BeforeInsert, BeforeUpdate, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcryptjs';
import { Company } from '../../companies/entities/company.entity';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
}

export enum UserArea {
  COMMERCIAL = 'commercial',
  TECHNOLOGY = 'technology',
  MARKETING = 'marketing',
  CUSTOMER_SERVICE = 'customer_service',
  OPERATIONS = 'operations',
  HR = 'hr',
}

export interface UserPermissions {
  agents: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  integrations: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  channels: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  users: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  subscriptions: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  profile: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  countryCode: string;

  @Column({ nullable: true })
  profileImage: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserArea,
    nullable: true,
  })
  area: UserArea;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  resetPasswordToken: string;

  @Column({ nullable: true })
  resetPasswordExpires: Date;

  @Column({ nullable: true })
  otpCode: string;

  @Column({ nullable: true })
  otpExpiry: Date;

  @Column({ 
    type: 'jsonb', 
    nullable: true,
    default: () => "'{}'" 
  })
  permissions: UserPermissions;

  @Column({ nullable: true })
  deletedAt: Date;

  // Relación con empresa
  @ManyToOne(() => Company, company => company.users, { nullable: true })
  @JoinColumn({ name: 'companyId' })
  company?: Company;

  @Column({ nullable: true })
  companyId?: string;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
