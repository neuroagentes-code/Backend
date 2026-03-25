import { IsOptional, IsString, IsUUID, IsInt, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LeadSector } from '../../crm/entities/lead.entity';

export class ClientListQueryDto {
  @ApiPropertyOptional({ 
    description: 'Término de búsqueda por nombre del cliente',
    example: 'Juan'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Filtrar por sector del cliente',
    enum: LeadSector,
    example: LeadSector.TECHNOLOGY
  })
  @IsOptional()
  @IsString()
  sector?: LeadSector;

  @ApiPropertyOptional({ 
    description: 'Filtrar por ID del funnel',
    example: 'uuid-del-funnel'
  })
  @IsOptional()
  @IsUUID()
  funnel?: string;

  @ApiPropertyOptional({ 
    description: 'Filtrar por ID de la etapa',
    example: 'uuid-de-la-etapa'
  })
  @IsOptional()
  @IsUUID()
  stage?: string;

  @ApiPropertyOptional({ 
    description: 'Filtrar por ID del usuario asignado',
    example: 'uuid-del-usuario'
  })
  @IsOptional()
  @IsUUID()
  assignedUser?: string;

  @ApiPropertyOptional({ 
    description: 'Número de página (empezando en 1)',
    minimum: 1,
    default: 1,
    example: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ 
    description: 'Número de registros por página',
    minimum: 1,
    maximum: 100,
    default: 20,
    example: 20
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ 
    description: 'Campo por el cual ordenar',
    example: 'name',
    default: 'createdAt'
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ 
    description: 'Dirección del ordenamiento',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
    default: 'DESC'
  })
  @IsOptional()
  @Transform(({ value }) => value?.toUpperCase())
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({ 
    description: 'Filtrar solo clientes activos',
    example: true,
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'false' || value === false) return false;
    if (value === 'true' || value === true) return true;
    return true;
  })
  active?: boolean = true;
}
