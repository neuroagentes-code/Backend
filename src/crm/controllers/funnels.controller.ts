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
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FunnelsService } from '../services/funnels.service';
import { CreateFunnelDto, UpdateFunnelDto } from '../dto/funnel.dto';
import { JwtAuthGuard } from '../../auth/guards/auth.guards';

@ApiTags('CRM - Funnels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('crm/funnels')
export class FunnelsController {
  constructor(private readonly funnelsService: FunnelsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nuevo funnel' })
  @ApiResponse({ status: 201, description: 'Funnel creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  async create(@Body() createFunnelDto: CreateFunnelDto, @Request() req) {
    const companyId = req.user.companyId;
    return this.funnelsService.create(createFunnelDto, companyId);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los funnels de la empresa' })
  @ApiResponse({ status: 200, description: 'Lista de funnels obtenida exitosamente.' })
  async findAll(@Request() req) {
    const companyId = req.user.companyId;
    return this.funnelsService.findAll(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un funnel específico' })
  @ApiResponse({ status: 200, description: 'Funnel obtenido exitosamente.' })
  @ApiResponse({ status: 404, description: 'Funnel no encontrado.' })
  async findOne(@Param('id') id: string, @Request() req) {
    const companyId = req.user.companyId;
    return this.funnelsService.findOne(id, companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un funnel' })
  @ApiResponse({ status: 200, description: 'Funnel actualizado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Funnel no encontrado.' })
  async update(
    @Param('id') id: string, 
    @Body() updateFunnelDto: UpdateFunnelDto,
    @Request() req
  ) {
    const companyId = req.user.companyId;
    return this.funnelsService.update(id, updateFunnelDto, companyId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un funnel' })
  @ApiResponse({ status: 204, description: 'Funnel eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Funnel no encontrado.' })
  @ApiResponse({ status: 400, description: 'No se puede eliminar un funnel con leads activos.' })
  async remove(@Param('id') id: string, @Request() req) {
    const companyId = req.user.companyId;
    return this.funnelsService.remove(id, companyId);
  }

  @Post(':id/stages')
  @ApiOperation({ summary: 'Agregar nueva etapa al funnel' })
  @ApiResponse({ status: 201, description: 'Etapa agregada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Funnel no encontrado.' })
  async addStage(
    @Param('id') funnelId: string,
    @Body() stageData: { name: string; color: string },
    @Request() req
  ) {
    const companyId = req.user.companyId;
    return this.funnelsService.addStage(funnelId, stageData, companyId);
  }

  @Patch(':funnelId/stages/:stageId')
  @ApiOperation({ summary: 'Actualizar etapa del funnel' })
  @ApiResponse({ status: 200, description: 'Etapa actualizada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Etapa no encontrada.' })
  async updateStage(
    @Param('stageId') stageId: string,
    @Body() stageData: { name?: string; color?: string },
    @Request() req
  ) {
    const companyId = req.user.companyId;
    return this.funnelsService.updateStage(stageId, stageData, companyId);
  }

  @Delete(':funnelId/stages/:stageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar etapa del funnel' })
  @ApiResponse({ status: 204, description: 'Etapa eliminada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Etapa no encontrada.' })
  @ApiResponse({ status: 400, description: 'No se puede eliminar una etapa con leads activos.' })
  async removeStage(@Param('stageId') stageId: string, @Request() req) {
    const companyId = req.user.companyId;
    return this.funnelsService.removeStage(stageId, companyId);
  }

  @Get(':id/users')
  @ApiOperation({ summary: 'Obtener usuarios asignados al funnel' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios obtenida exitosamente.' })
  async getAssignedUsers(@Param('id') funnelId: string, @Request() req) {
    const companyId = req.user.companyId;
    return this.funnelsService.getAssignedUsers(funnelId, companyId);
  }
}
