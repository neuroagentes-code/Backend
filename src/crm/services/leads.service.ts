import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from '../entities/lead.entity';
import { Stage } from '../entities/stage.entity';
import { CreateLeadDto, UpdateLeadDto, UpdateLeadStageDto, CrmFiltersDto } from '../dto/lead.dto';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadsRepository: Repository<Lead>,
    @InjectRepository(Stage)
    private readonly stagesRepository: Repository<Stage>,
  ) {}

  async create(createLeadDto: CreateLeadDto, companyId: string): Promise<Lead> {
    // Verificar que el stage pertenece al funnel y a la company
    const stage = await this.stagesRepository.findOne({
      where: { id: createLeadDto.stageId },
      relations: ['funnel']
    });

    if (!stage || stage.funnel.companyId !== companyId || stage.funnelId !== createLeadDto.funnelId) {
      throw new BadRequestException('Invalid stage or funnel');
    }

    const lead = this.leadsRepository.create({
      ...createLeadDto,
      companyId,
      lastContactAt: new Date(),
    });

    return this.leadsRepository.save(lead);
  }

  async findAll(companyId: string, filters?: CrmFiltersDto): Promise<Lead[]> {
    const query = this.leadsRepository.createQueryBuilder('lead')
      .leftJoinAndSelect('lead.assignedUser', 'assignedUser')
      .leftJoinAndSelect('lead.funnel', 'funnel')
      .leftJoinAndSelect('lead.stage', 'stage')
      .where('lead.companyId = :companyId', { companyId })
      .andWhere('lead.isActive = :isActive', { isActive: true });

    if (filters?.search) {
      query.andWhere(
        '(lead.name ILIKE :search OR lead.email ILIKE :search OR lead.companyName ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    if (filters?.funnelId) {
      query.andWhere('lead.funnelId = :funnelId', { funnelId: filters.funnelId });
    }

    if (filters?.assignedUserId) {
      query.andWhere('lead.assignedUserId = :assignedUserId', { assignedUserId: filters.assignedUserId });
    }

    if (filters?.role) {
      query.andWhere('assignedUser.role = :role', { role: filters.role });
    }

    return query
      .orderBy('lead.lastContactAt', 'DESC')
      .getMany();
  }

  async findByFunnel(funnelId: string, companyId: string): Promise<Lead[]> {
    return this.leadsRepository.find({
      where: { 
        funnelId, 
        companyId,
        isActive: true 
      },
      relations: ['assignedUser', 'stage'],
      order: { lastContactAt: 'DESC' }
    });
  }

  async findByStage(stageId: string, companyId: string): Promise<Lead[]> {
    // Verificar que el stage pertenece a la company
    const stage = await this.stagesRepository.findOne({
      where: { id: stageId },
      relations: ['funnel']
    });

    if (!stage || stage.funnel.companyId !== companyId) {
      throw new NotFoundException(`Stage with ID ${stageId} not found`);
    }

    return this.leadsRepository.find({
      where: { 
        stageId, 
        companyId,
        isActive: true 
      },
      relations: ['assignedUser'],
      order: { lastContactAt: 'DESC' }
    });
  }

  async findOne(id: string, companyId: string): Promise<Lead> {
    const lead = await this.leadsRepository.findOne({
      where: { id, companyId },
      relations: ['assignedUser', 'funnel', 'stage', 'company']
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    return lead;
  }

  async update(id: string, updateLeadDto: UpdateLeadDto, companyId: string): Promise<Lead> {
    const lead = await this.findOne(id, companyId);
    
    Object.assign(lead, updateLeadDto);
    await this.leadsRepository.save(lead);
    
    return this.findOne(id, companyId);
  }

  async updateStage(id: string, updateStageDto: UpdateLeadStageDto, companyId: string): Promise<Lead> {
    const lead = await this.findOne(id, companyId);
    
    // Verificar que la nueva stage pertenece al mismo funnel y company
    const newStage = await this.stagesRepository.findOne({
      where: { id: updateStageDto.stageId },
      relations: ['funnel']
    });

    if (!newStage || 
        newStage.funnel.companyId !== companyId || 
        newStage.funnelId !== lead.funnelId) {
      throw new BadRequestException('Invalid stage for this lead');
    }

    lead.stageId = updateStageDto.stageId;
    lead.lastContactAt = new Date();
    
    await this.leadsRepository.save(lead);
    
    return this.findOne(id, companyId);
  }

  async remove(id: string, companyId: string): Promise<void> {
    const lead = await this.findOne(id, companyId);
    
    // Soft delete
    lead.isActive = false;
    lead.deletedAt = new Date();
    
    await this.leadsRepository.save(lead);
  }

  async getLeadsByStageForFunnel(funnelId: string, companyId: string): Promise<any> {
    const leads = await this.leadsRepository
      .createQueryBuilder('lead')
      .leftJoinAndSelect('lead.assignedUser', 'assignedUser')
      .leftJoinAndSelect('lead.stage', 'stage')
      .where('lead.funnelId = :funnelId', { funnelId })
      .andWhere('lead.companyId = :companyId', { companyId })
      .andWhere('lead.isActive = :isActive', { isActive: true })
      .orderBy('stage.order', 'ASC')
      .addOrderBy('lead.lastContactAt', 'DESC')
      .getMany();

    // Agrupar leads por stage
    const leadsByStage = leads.reduce((acc, lead) => {
      const stageId = lead.stageId;
      if (!acc[stageId]) {
        acc[stageId] = {
          stage: lead.stage,
          leads: []
        };
      }
      acc[stageId].leads.push(lead);
      return acc;
    }, {});

    return leadsByStage;
  }

  async getStatistics(companyId: string, funnelId?: string): Promise<any> {
    const query = this.leadsRepository.createQueryBuilder('lead')
      .leftJoin('lead.stage', 'stage')
      .leftJoin('lead.funnel', 'funnel')
      .where('lead.companyId = :companyId', { companyId })
      .andWhere('lead.isActive = :isActive', { isActive: true });

    if (funnelId) {
      query.andWhere('lead.funnelId = :funnelId', { funnelId });
    }

    const totalLeads = await query.getCount();
    
    const leadsByStage = await query
      .select([
        'stage.id as stageId',
        'stage.name as stageName',
        'stage.color as stageColor',
        'COUNT(lead.id) as count'
      ])
      .groupBy('stage.id, stage.name, stage.color')
      .getRawMany();

    const totalValue = await query
      .select('SUM(lead.value)', 'total')
      .getRawOne();

    return {
      totalLeads,
      leadsByStage,
      totalValue: totalValue?.total || 0
    };
  }
}
