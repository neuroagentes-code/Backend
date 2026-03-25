import { User } from '../../auth/entities/user.entity';
import { Exclude, Expose } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  phone?: string;

  @Expose()
  countryCode?: string;

  @Expose()
  profileImage?: string;

  @Expose()
  role: string;

  @Expose()
  area?: string;

  @Expose()
  isActive: boolean;

  @Expose()
  permissions?: any;

  @Expose()
  company?: any;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  @Exclude()
  password: string;

  @Exclude()
  resetPasswordToken: string;

  @Exclude()
  resetPasswordExpires: Date;

  @Exclude()
  otpCode: string;

  @Exclude()
  otpExpiry: Date;

  @Exclude()
  deletedAt: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
