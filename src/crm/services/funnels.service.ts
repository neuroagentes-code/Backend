import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Funnel } from '../entities/funnel.entity';
import { Stage } from '../entities/stage.entity';
import { CreateFunnelDto, UpdateFunnelDto } from '../dto/funnel.dto';

@Injectable()
export class FunnelsService {
  constructor(
    @InjectRepository(Funnel)
    private funnelsRepository: Repository<Funnel>,
    @InjectRepository(Stage)
    private stagesRepository: Repository<Stage>,
  ) {}

  async create(createFunnelDto: CreateFunnelDto, companyId: string): Promise<Funnel> {
    const { stages, ...funnelData } = createFunnelDto;

    // Crear el funnel
    const funnel = this.funnelsRepository.create({
      ...funnelData,
      companyId,
    });

    const savedFunnel = await this.funnelsRepository.save(funnel);

    // Crear las etapas
    const stageEntities = stages.map((stageDto, index) => 
      this.stagesRepository.create({
        ...stageDto,
        order: stageDto.order !== undefined ? stageDto.order : index + 1,
        funnelId: savedFunnel.id,
      })
    );

    await this.stagesRepository.save(stageEntities);

    // Retornar el funnel con sus etapas
    return this.findOne(savedFunnel.id, companyId);
  }

  async findAll(companyId: string): Promise<Funnel[]> {
    return this.funnelsRepository.find({
      where: { companyId },
      relations: ['stages', 'leads'],
      order: {
        createdAt: 'DESC',
        stages: { order: 'ASC' }
      }
    });
  }

  async findOne(id: string, companyId: string): Promise<Funnel> {
    const funnel = await this.funnelsRepository.findOne({
      where: { id, companyId },
      relations: ['stages', 'leads', 'leads.assignedUser'],
      order: {
        stages: { order: 'ASC' }
      }
    });

    if (!funnel) {
      throw new NotFoundException(`Funnel with ID ${id} not found`);
    }

    return funnel;
  }

  async update(id: string, updateFunnelDto: UpdateFunnelDto, companyId: string): Promise<Funnel> {
    const funnel = await this.findOne(id, companyId);
    
    Object.assign(funnel, updateFunnelDto);
    await this.funnelsRepository.save(funnel);
    
    return this.findOne(id, companyId);
  }

  async remove(id: string, companyId: string): Promise<void> {
    const funnel = await this.findOne(id, companyId);
    
    // Verificar que no tenga leads activos
    const activeLeadsCount = await this.funnelsRepository
      .createQueryBuilder('funnel')
      .leftJoin('funnel.leads', 'lead')
      .where('funnel.id = :id', { id })
      .andWhere('lead.isActive = :isActive', { isActive: true })
      .getCount();

    if (activeLeadsCount > 0) {
      throw new BadRequestException('Cannot delete funnel with active leads');
    }

    await this.funnelsRepository.remove(funnel);
  }

  async addStage(funnelId: string, stageData: { name: string; color: string }, companyId: string): Promise<Stage> {
    const funnel = await this.findOne(funnelId, companyId);
    
    // Obtener el orden máximo actual
    const maxOrder = await this.stagesRepository
      .createQueryBuilder('stage')
      .where('stage.funnelId = :funnelId', { funnelId })
      .select('MAX(stage.order)', 'maxOrder')
      .getRawOne();

    const newOrder = (maxOrder?.maxOrder || 0) + 1;

    const stage = this.stagesRepository.create({
      ...stageData,
      funnelId,
      order: newOrder,
    });

    return this.stagesRepository.save(stage);
  }

  async updateStage(stageId: string, stageData: Partial<Stage>, companyId: string): Promise<Stage> {
    const stage = await this.stagesRepository.findOne({
      where: { id: stageId },
      relations: ['funnel']
    });

    if (!stage || stage.funnel.companyId !== companyId) {
      throw new NotFoundException(`Stage with ID ${stageId} not found`);
    }

    Object.assign(stage, stageData);
    return this.stagesRepository.save(stage);
  }

  async removeStage(stageId: string, companyId: string): Promise<void> {
    const stage = await this.stagesRepository.findOne({
      where: { id: stageId },
      relations: ['funnel', 'leads']
    });

    if (!stage || stage.funnel.companyId !== companyId) {
      throw new NotFoundException(`Stage with ID ${stageId} not found`);
    }

    // Verificar que no tenga leads activos
    const activeLeadsCount = stage.leads?.filter(lead => lead.isActive).length || 0;
    if (activeLeadsCount > 0) {
      throw new BadRequestException('Cannot delete stage with active leads');
    }

    await this.stagesRepository.remove(stage);
  }

  async getAssignedUsers(funnelId: string, companyId: string): Promise<any[]> {
    const result = await this.funnelsRepository
      .createQueryBuilder('funnel')
      .leftJoin('funnel.leads', 'lead')
      .leftJoin('lead.assignedUser', 'user')
      .select([
        'user.id as id',
        'user.firstName as firstName',
        'user.lastName as lastName',
        'user.email as email',
        'COUNT(DISTINCT lead.id) as leadCount'
      ])
      .where('funnel.id = :funnelId', { funnelId })
      .andWhere('funnel.companyId = :companyId', { companyId })
      .andWhere('user.id IS NOT NULL')
      .groupBy('user.id, user.firstName, user.lastName, user.email')
      .getRawMany();

    return result;
  }
}
