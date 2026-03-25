import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';

@Entity('funnels')
export class Funnel {
  @Column({ primary: true, type: 'uuid', generated: 'uuid' })
  id: string;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column()
  name: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ nullable: true })
  description: string;

  // Relación con empresa
  @ManyToOne(() => Company, { nullable: false })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'company_id' })
  companyId: string;

  // Relación con stages
  @OneToMany('Stage', 'funnel', { cascade: true })
  stages: any[];

  // Relación con leads
  @OneToMany('Lead', 'funnel')
  leads: any[];

  // Computed property para número de etapas
  get stageCount(): number {
    return this.stages ? this.stages.length : 0;
  }
}
