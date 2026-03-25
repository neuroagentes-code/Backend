import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { User } from '../../auth/entities/user.entity';

export enum LeadSector {
  TECHNOLOGY = 'technology',
  HEALTHCARE = 'healthcare',
  FINANCE = 'finance',
  EDUCATION = 'education',
  RETAIL = 'retail',
  MANUFACTURING = 'manufacturing',
  REAL_ESTATE = 'real_estate',
  CONSULTING = 'consulting',
  OTHER = 'other'
}

@Entity('leads')
export class Lead {
  @Column({ primary: true, type: 'uuid', generated: 'uuid' })
  id: string;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column()
  name: string;

  @Column({ name: 'company_name', nullable: true })
  companyName: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'country_code', nullable: true })
  countryCode: string;

  @Column({
    type: 'enum',
    enum: LeadSector,
    nullable: true,
  })
  sector: LeadSector;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  value: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Relación con empresa (propietaria del lead)
  @ManyToOne(() => Company, { nullable: false })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'company_id' })
  companyId: string;

  // Usuario asignado
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_user_id' })
  assignedUser: User;

  @Column({ name: 'assigned_user_id', nullable: true })
  assignedUserId: string;

  // Funnel y Stage actuales
  @ManyToOne('Funnel', 'leads', { nullable: false })
  @JoinColumn({ name: 'funnel_id' })
  funnel: any;

  @Column({ name: 'funnel_id' })
  funnelId: string;

  @ManyToOne('Stage', 'leads', { nullable: false })
  @JoinColumn({ name: 'stage_id' })
  stage: any;

  @Column({ name: 'stage_id' })
  stageId: string;

  // Fecha de último contacto
  @Column({ name: 'last_contact_at', nullable: true })
  lastContactAt: Date;

  // Campos de auditoría adicionales
  @Column({ nullable: true })
  source: string; // De dónde vino el lead

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

  // Computed property para teléfono completo
  get fullPhone(): string {
    if (this.countryCode && this.phone) {
      return `${this.countryCode}${this.phone}`;
    }
    return this.phone || '';
  }
}
