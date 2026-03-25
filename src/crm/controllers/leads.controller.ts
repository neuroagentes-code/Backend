import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LeadsService } from '../services/leads.service';
import { CreateLeadDto, UpdateLeadDto, UpdateLeadStageDto, CrmFiltersDto } from '../dto/lead.dto';
import { JwtAuthGuard } from '../../auth/guards/auth.guards';

@ApiTags('CRM - Leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('crm/leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nuevo lead' })
  @ApiResponse({ status: 201, description: 'Lead creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  async create(@Body() createLeadDto: CreateLeadDto, @Request() req) {
    const companyId = req.user.companyId;
    return this.leadsService.create(createLeadDto, companyId);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los leads con filtros' })
  @ApiResponse({ status: 200, description: 'Lista de leads obtenida exitosamente.' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre de cliente' })
  @ApiQuery({ name: 'funnelId', required: false, description: 'Filtrar por funnel específico' })
  @ApiQuery({ name: 'assignedUserId', required: false, description: 'Filtrar por usuario asignado' })
  @ApiQuery({ name: 'role', required: false, description: 'Filtrar por función/rol' })
  async findAll(@Query() filters: CrmFiltersDto, @Request() req) {
    const companyId = req.user.companyId;
    return this.leadsService.findAll(companyId, filters);
  }

  @Get('funnel/:funnelId')
  @ApiOperation({ summary: 'Obtener leads por funnel' })
  @ApiResponse({ status: 200, description: 'Lista de leads del funnel obtenida exitosamente.' })
  async findByFunnel(@Param('funnelId') funnelId: string, @Request() req) {
    const companyId = req.user.companyId;
    return this.leadsService.findByFunnel(funnelId, companyId);
  }

  @Get('funnel/:funnelId/pipeline')
  @ApiOperation({ summary: 'Obtener leads agrupados por etapa para el pipeline' })
  @ApiResponse({ status: 200, description: 'Pipeline de leads obtenido exitosamente.' })
  async getPipeline(@Param('funnelId') funnelId: string, @Request() req) {
    const companyId = req.user.companyId;
    return this.leadsService.getLeadsByStageForFunnel(funnelId, companyId);
  }

  @Get('stage/:stageId')
  @ApiOperation({ summary: 'Obtener leads por etapa' })
  @ApiResponse({ status: 200, description: 'Lista de leads de la etapa obtenida exitosamente.' })
  async findByStage(@Param('stageId') stageId: string, @Request() req) {
    const companyId = req.user.companyId;
    return this.leadsService.findByStage(stageId, companyId);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Obtener estadísticas de leads' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente.' })
  @ApiQuery({ name: 'funnelId', required: false, description: 'Filtrar estadísticas por funnel' })
  async getStatistics(@Query('funnelId') funnelId: string, @Request() req) {
    const companyId = req.user.companyId;
    return this.leadsService.getStatistics(companyId, funnelId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un lead específico' })
  @ApiResponse({ status: 200, description: 'Lead obtenido exitosamente.' })
  @ApiResponse({ status: 404, description: 'Lead no encontrado.' })
  async findOne(@Param('id') id: string, @Request() req) {
    const companyId = req.user.companyId;
    return this.leadsService.findOne(id, companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un lead' })
  @ApiResponse({ status: 200, description: 'Lead actualizado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Lead no encontrado.' })
  async update(
    @Param('id') id: string, 
    @Body() updateLeadDto: UpdateLeadDto,
    @Request() req
  ) {
    const companyId = req.user.companyId;
    return this.leadsService.update(id, updateLeadDto, companyId);
  }

  @Patch(':id/stage')
  @ApiOperation({ summary: 'Cambiar etapa de un lead (para drag & drop)' })
  @ApiResponse({ status: 200, description: 'Etapa del lead actualizada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Lead no encontrado.' })
  @ApiResponse({ status: 400, description: 'Etapa inválida para este lead.' })
  async updateStage(
    @Param('id') id: string,
    @Body() updateStageDto: UpdateLeadStageDto,
    @Request() req
  ) {
    const companyId = req.user.companyId;
    return this.leadsService.updateStage(id, updateStageDto, companyId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un lead (soft delete)' })
  @ApiResponse({ status: 204, description: 'Lead eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Lead no encontrado.' })
  async remove(@Param('id') id: string, @Request() req) {
    const companyId = req.user.companyId;
    return this.leadsService.remove(id, companyId);
  }
}
