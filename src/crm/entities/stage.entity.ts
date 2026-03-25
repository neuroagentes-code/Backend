import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';

@Entity('stages')
export class Stage {
  @Column({ primary: true, type: 'uuid', generated: 'uuid' })
  id: string;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column()
  name: string;

  @Column()
  color: string;

  @Column()
  order: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // Relación con funnel
  @ManyToOne('Funnel', 'stages', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'funnel_id' })
  funnel: any;

  @Column({ name: 'funnel_id' })
  funnelId: string;

  // Relación con leads
  @OneToMany('Lead', 'stage')
  leads: any[];

  // Computed property para número de leads
  get leadCount(): number {
    return this.leads ? this.leads.length : 0;
  }
}
