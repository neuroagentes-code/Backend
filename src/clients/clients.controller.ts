import { 
  Controller, 
  Get, 
  Patch, 
  Param, 
  Query, 
  Body, 
  UseGuards,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiQuery,
  ApiParam
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import { GetUser } from '../auth/decorators/auth.decorators';
import { User } from '../auth/entities/user.entity';
import { ClientsService } from './clients.service';
import { ClientListQueryDto } from './dto/client-list-query.dto';
import { 
  ClientListResponseDto, 
  ClientDetailDto, 
  UpdateClientStatusDto 
} from './dto/client-response.dto';

@ApiTags('Clientes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Obtener lista de clientes',
    description: 'Obtiene la lista paginada de clientes con filtros y búsqueda avanzada'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de clientes obtenida exitosamente',
    type: ClientListResponseDto
  })
  @ApiQuery({ 
    name: 'search', 
    required: false, 
    description: 'Buscar por nombre o email del cliente'
  })
  @ApiQuery({ 
    name: 'sector', 
    required: false, 
    description: 'Filtrar por sector'
  })
  @ApiQuery({ 
    name: 'funnel', 
    required: false, 
    description: 'Filtrar por funnel (UUID)'
  })
  @ApiQuery({ 
    name: 'stage', 
    required: false, 
    description: 'Filtrar por etapa (UUID)'
  })
  @ApiQuery({ 
    name: 'assignedUser', 
    required: false, 
    description: 'Filtrar por usuario asignado (UUID)'
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    description: 'Número de página (default: 1)'
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    description: 'Registros por página (default: 20, max: 100)'
  })
  @ApiQuery({ 
    name: 'sortBy', 
    required: false, 
    description: 'Campo para ordenar (default: createdAt)'
  })
  @ApiQuery({ 
    name: 'sortOrder', 
    required: false, 
    description: 'Dirección del ordenamiento: ASC o DESC (default: DESC)'
  })
  @ApiQuery({ 
    name: 'active', 
    required: false, 
    description: 'Filtrar por estado activo (default: true)'
  })
  async findAll(
    @Query() query: ClientListQueryDto,
    @GetUser() user: User
  ): Promise<ClientListResponseDto> {
    if (!user.companyId) {
      throw new Error('Usuario no tiene empresa asignada');
    }
    
    return this.clientsService.findAll(query, user.companyId);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Obtener detalle de cliente',
    description: 'Obtiene la información completa de un cliente específico'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID único del cliente (UUID)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Detalle del cliente obtenido exitosamente',
    type: ClientDetailDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Cliente no encontrado'
  })
  async findOne(
    @Param('id') id: string,
    @GetUser() user: User
  ): Promise<ClientDetailDto> {
    if (!user.companyId) {
      throw new Error('Usuario no tiene empresa asignada');
    }
    
    return this.clientsService.findOne(id, user.companyId);
  }

  @Patch(':id/status')
  @ApiOperation({ 
    summary: 'Cambiar estado del cliente',
    description: 'Activa o desactiva un cliente específico'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID único del cliente (UUID)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Estado del cliente actualizado exitosamente',
    type: ClientDetailDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Cliente no encontrado'
  })
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateClientStatusDto,
    @GetUser() user: User
  ): Promise<ClientDetailDto> {
    if (!user.companyId) {
      throw new Error('Usuario no tiene empresa asignada');
    }
    
    return this.clientsService.updateStatus(id, updateStatusDto, user.companyId);
  }
}
