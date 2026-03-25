import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('companies')
export class Company extends BaseEntity {
  @Column()
  name: string;

  @Column()
  country: string;

  @Column()
  department: string;

  @Column()
  city: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  website?: string;

  @Column({ nullable: true })
  description?: string;

  // Documentos legales (URLs de archivos)
  @Column({ nullable: true })
  chamberOfCommerceUrl?: string;

  @Column({ nullable: true })
  rutUrl?: string;

  @Column({ nullable: true })
  legalRepresentativeIdUrl?: string;

  // Información del representante legal
  @Column({ nullable: true })
  legalRepresentativeName?: string;

  @Column({ nullable: true })
  legalRepresentativeId?: string;

  // Estado de la empresa
  @Column({ default: true })
  isActive: boolean;

  // Términos y condiciones
  @Column({ default: false })
  termsAccepted: boolean;

  @Column({ nullable: true })
  termsAcceptedAt?: Date;

  // Relación con usuarios
  @OneToMany(() => User, user => user.company)
  users: User[];
}
