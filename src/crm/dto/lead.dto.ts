import { IsString, IsOptional, IsEmail, IsEnum, IsUUID, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LeadSector } from '../entities/lead.entity';

export class CreateLeadDto {
  @ApiProperty({ description: 'Nombre del contacto' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Nombre de la empresa', required: false })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ description: 'Email del contacto' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Teléfono del contacto', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Código de país', required: false })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiProperty({ description: 'Sector de la empresa', enum: LeadSector, required: false })
  @IsOptional()
  @IsEnum(LeadSector)
  sector?: LeadSector;

  @ApiProperty({ description: 'Valor económico del lead', required: false })
  @IsOptional()
  @IsNumber()
  value?: number;

  @ApiProperty({ description: 'Notas adicionales', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'ID del usuario asignado', required: false })
  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @ApiProperty({ description: 'ID del funnel' })
  @IsUUID()
  funnelId: string;

  @ApiProperty({ description: 'ID de la etapa' })
  @IsUUID()
  stageId: string;

  @ApiProperty({ description: 'Fuente del lead', required: false })
  @IsOptional()
  @IsString()
  source?: string;
}

export class UpdateLeadDto {
  @ApiProperty({ description: 'Nombre del contacto', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Nombre de la empresa', required: false })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ description: 'Email del contacto', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Teléfono del contacto', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Código de país', required: false })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiProperty({ description: 'Sector de la empresa', enum: LeadSector, required: false })
  @IsOptional()
  @IsEnum(LeadSector)
  sector?: LeadSector;

  @ApiProperty({ description: 'Valor económico del lead', required: false })
  @IsOptional()
  @IsNumber()
  value?: number;

  @ApiProperty({ description: 'Notas adicionales', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'ID del usuario asignado', required: false })
  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @ApiProperty({ description: 'Estado del lead', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateLeadStageDto {
  @ApiProperty({ description: 'ID de la nueva etapa' })
  @IsUUID()
  stageId: string;
}

export class CrmFiltersDto {
  @ApiProperty({ description: 'Buscar por nombre de cliente', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Filtrar por funnel específico', required: false })
  @IsOptional()
  @IsUUID()
  funnelId?: string;

  @ApiProperty({ description: 'Filtrar por usuario asignado', required: false })
  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @ApiProperty({ description: 'Filtrar por función/rol', required: false })
  @IsOptional()
  @IsString()
  role?: string;
}
