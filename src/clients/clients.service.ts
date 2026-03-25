import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Lead } from '../crm/entities/lead.entity';
import { ClientListQueryDto } from './dto/client-list-query.dto';
import { 
  ClientListItemDto, 
  ClientDetailDto, 
  ClientListResponseDto,
  UpdateClientStatusDto 
} from './dto/client-response.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
  ) {}

  async findAll(
    query: ClientListQueryDto,
    companyId: string
  ): Promise<ClientListResponseDto> {
    const { 
      search, 
      sector, 
      funnel, 
      stage, 
      assignedUser, 
      page = 1, 
      limit = 20, 
      sortBy = 'createdAt', 
      sortOrder = 'DESC',
      active = true
    } = query;

    // Crear query builder
    const queryBuilder = this.createBaseQueryBuilder();

    // Filtrar por compañía
    queryBuilder.andWhere('lead.companyId = :companyId', { companyId });

    // Filtrar por estado activo
    queryBuilder.andWhere('lead.isActive = :active', { active });

    // Aplicar filtros dinámicos
    this.applyFilters(queryBuilder, { search, sector, funnel, stage, assignedUser });

    // Aplicar ordenamiento
    this.applySorting(queryBuilder, sortBy, sortOrder);

    // Aplicar paginación
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Ejecutar consulta
    const [leads, total] = await queryBuilder.getManyAndCount();

    // Mapear a DTOs
    const clients = leads.map(lead => this.mapToListItem(lead));

    // Calcular metadatos de paginación
    const totalPages = Math.ceil(total / limit);
    const pagination = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };

    return { clients, pagination };
  }

  async findOne(id: string, companyId: string): Promise<ClientDetailDto> {
    const queryBuilder = this.createBaseQueryBuilder()
      .where('lead.id = :id', { id })
      .andWhere('lead.companyId = :companyId', { companyId });

    const lead = await queryBuilder.getOne();

    if (!lead) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    return this.mapToDetail(lead);
  }

  async updateStatus(
    id: string, 
    updateData: UpdateClientStatusDto,
    companyId: string
  ): Promise<ClientDetailDto> {
    // Verificar que el cliente existe y pertenece a la compañía
    const lead = await this.leadRepository.findOne({
      where: { id, companyId },
      relations: ['assignedUser', 'funnel', 'stage', 'company']
    });

    if (!lead) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    // Actualizar estado
    lead.isActive = updateData.active;
    const updatedLead = await this.leadRepository.save(lead);

    return this.mapToDetail(updatedLead);
  }

  private createBaseQueryBuilder(): SelectQueryBuilder<Lead> {
    return this.leadRepository
      .createQueryBuilder('lead')
      .leftJoinAndSelect('lead.assignedUser', 'assignedUser')
      .leftJoinAndSelect('lead.funnel', 'funnel')
      .leftJoinAndSelect('lead.stage', 'stage')
      .leftJoinAndSelect('lead.company', 'company')
      // TODO: Agregar join para última interacción cuando implementemos el módulo de interacciones
      .select([
        'lead.id',
        'lead.name',
        'lead.email', 
        'lead.phone',
        'lead.countryCode',
        'lead.company',
        'lead.sector',
        'lead.value',
        'lead.lastContactAt',
        'lead.source',
        'lead.isActive',
        'lead.createdAt',
        'lead.updatedAt',
        'assignedUser.id',
        'assignedUser.firstName',
        'assignedUser.lastName', 
        'assignedUser.email',
        'funnel.id',
        'funnel.name',
        'stage.id',
        'stage.name',
        'stage.color',
        'company.id',
        'company.name'
      ]);
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<Lead>, 
    filters: {
      search?: string;
      sector?: string;
      funnel?: string;
      stage?: string;
      assignedUser?: string;
    }
  ): void {
    const { search, sector, funnel, stage, assignedUser } = filters;

    if (search) {
      queryBuilder.andWhere(
        '(LOWER(lead.name) LIKE LOWER(:search) OR LOWER(lead.email) LIKE LOWER(:search))',
        { search: `%${search}%` }
      );
    }

    if (sector) {
      queryBuilder.andWhere('lead.sector = :sector', { sector });
    }

    if (funnel) {
      queryBuilder.andWhere('lead.funnelId = :funnel', { funnel });
    }

    if (stage) {
      queryBuilder.andWhere('lead.stageId = :stage', { stage });
    }

    if (assignedUser) {
      queryBuilder.andWhere('lead.assignedUserId = :assignedUser', { assignedUser });
    }
  }

  private applySorting(
    queryBuilder: SelectQueryBuilder<Lead>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC'
  ): void {
    // Mapear campos de ordenamiento
    const sortMap = {
      'name': 'lead.name',
      'email': 'lead.email',
      'createdAt': 'lead.createdAt',
      'updatedAt': 'lead.updatedAt',
      'value': 'lead.value',
      'assignedUser': 'assignedUser.firstName'
    };

    const sortField = sortMap[sortBy] || 'lead.createdAt';
    queryBuilder.orderBy(sortField, sortOrder);
  }

  private mapToListItem(lead: Lead): ClientListItemDto {
    return {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.fullPhone,
      lastInteraction: lead.lastContactAt, // Usar el campo lastContactAt de la entidad
      assignedUser: lead.assignedUser ? {
        id: lead.assignedUser.id,
        name: `${lead.assignedUser.firstName} ${lead.assignedUser.lastName}`,
        email: lead.assignedUser.email
      } : null,
      active: lead.isActive,
      company: lead.company?.name || lead.companyName,
      sector: lead.sector,
      funnel: lead.funnel ? {
        id: lead.funnel.id,
        name: lead.funnel.name
      } : null,
      stage: lead.stage ? {
        id: lead.stage.id,
        name: lead.stage.name,
        color: lead.stage.color
      } : null
    };
  }

  private mapToDetail(lead: Lead): ClientDetailDto {
    const baseData = this.mapToListItem(lead);
    
    return {
      ...baseData,
      value: lead.value,
      notes: lead.notes,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt
    };
  }
}
