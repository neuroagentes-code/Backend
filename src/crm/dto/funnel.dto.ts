import { IsString, IsOptional, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStageDto {
  @ApiProperty({ description: 'Nombre de la etapa' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Color de la etapa (hex)', example: '#FF5733' })
  @IsString()
  color: string;

  @ApiProperty({ description: 'Orden de la etapa' })
  @IsOptional()
  order?: number;
}

export class CreateFunnelDto {
  @ApiProperty({ description: 'Nombre del funnel' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Descripción del funnel', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Etapas del funnel', type: [CreateStageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStageDto)
  stages: CreateStageDto[];
}

export class UpdateFunnelDto {
  @ApiProperty({ description: 'Nombre del funnel', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Descripción del funnel', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Estado del funnel', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class FunnelResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  stageCount: number;

  @ApiProperty()
  assignedUsers: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
