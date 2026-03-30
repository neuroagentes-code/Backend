import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { LeadSector } from '../../crm/entities/lead.entity';

export class ClientListItemDto {
  @ApiProperty({ 
    description: 'ID único del cliente',
    example: 'uuid-del-cliente'
  })
  id: string;

  @ApiProperty({ 
    description: 'Nombre completo del cliente',
    example: 'Juan Carlos Pérez'
  })
  name: string;

  @ApiProperty({ 
    description: 'Correo electrónico del cliente',
    example: 'juan.perez@empresa.com'
  })
  email: string;

  @ApiPropertyOptional({ 
    description: 'Número de celular completo con indicativo',
    example: '+57 300 123 4567'
  })
  phone?: string;

  @ApiPropertyOptional({ 
    description: 'Fecha y hora de la última interacción',
    example: '2026-03-25T14:30:00Z'
  })
  lastInteraction?: Date;

  @ApiPropertyOptional({ 
    description: 'Usuario asignado al cliente'
  })
  assignedUser?: {
    id: string;
    name: string;
    email: string;
  };

  @ApiProperty({ 
    description: 'Estado del cliente (activo/inactivo)',
    example: true
  })
  active: boolean;

  @ApiPropertyOptional({ 
    description: 'Empresa del cliente',
    example: 'TechCorp S.A.S'
  })
  company?: string;

  @ApiPropertyOptional({ 
    description: 'Sector del cliente',
    enum: LeadSector,
    example: LeadSector.TECHNOLOGY
  })
  sector?: LeadSector;

  @ApiPropertyOptional({ 
    description: 'Información del funnel'
  })
  funnel?: {
    id: string;
    name: string;
  };

  @ApiPropertyOptional({ 
    description: 'Información de la etapa actual'
  })
  stage?: {
    id: string;
    name: string;
    color: string;
  };
}

export class ClientDetailDto extends ClientListItemDto {
  @ApiPropertyOptional({ 
    description: 'Valor potencial del cliente',
    example: 5000000
  })
  value?: number;

  @ApiPropertyOptional({ 
    description: 'Notas adicionales del cliente',
    example: 'Cliente interesado en soluciones de IA'
  })
  notes?: string;

  @ApiPropertyOptional({ 
    description: 'País del cliente',
    example: 'Colombia'
  })
  country?: string;

  @ApiProperty({ 
    description: 'Fecha de creación del registro',
    example: '2026-03-20T10:00:00Z'
  })
  createdAt: Date;

  @ApiProperty({ 
    description: 'Fecha de última actualización',
    example: '2026-03-25T14:30:00Z'
  })
  updatedAt: Date;
}

export class ClientListResponseDto {
  @ApiProperty({ 
    description: 'Lista de clientes',
    type: [ClientListItemDto]
  })
  clients: ClientListItemDto[];

  @ApiProperty({ 
    description: 'Metadatos de paginación'
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export class UpdateClientStatusDto {
  @ApiProperty({ 
    description: 'Nuevo estado del cliente',
    example: true
  })
  @IsBoolean()
  active: boolean;
}
