import { DataSource } from 'typeorm';
import { Company } from '../companies/entities/company.entity';
import { User, UserRole } from '../auth/entities/user.entity';
import { Funnel } from '../crm/entities/funnel.entity';
import { Stage } from '../crm/entities/stage.entity';
import { Lead, LeadSector } from '../crm/entities/lead.entity';

export class CrmSeeder {
  constructor(private readonly dataSource: DataSource) {}

  async seed() {
    console.log('🌱 Seeding CRM data...');

    const companyRepository = this.dataSource.getRepository(Company);
    const userRepository = this.dataSource.getRepository(User);
    const funnelRepository = this.dataSource.getRepository(Funnel);
    const stageRepository = this.dataSource.getRepository(Stage);
    const leadRepository = this.dataSource.getRepository(Lead);

    // Buscar una company existente (debe haber al menos una después de user.seeder)
    let company = await companyRepository.findOne({ where: {} });
    
    if (!company) {
      console.log('❌ No company found. Creating demo company...');
      company = companyRepository.create({
        name: 'NeuroAgentes Demo',
        country: 'Colombia',
        department: 'Antioquia',
        city: 'Medellín',
        address: 'Carrera 70 #52-20',
        phone: '+57 4 444 4444',
        website: 'https://demo.neuroagentes.co',
        description: 'Empresa demo para pruebas del CRM',
        legalRepresentativeName: 'Juan Demo',
        legalRepresentativeId: '12345678',
        isActive: true,
        termsAccepted: true,
        termsAcceptedAt: new Date(),
      });
      company = await companyRepository.save(company);
    }

    // Verificar si ya hay funnels
    const existingFunnel = await funnelRepository.findOne({
      where: { companyId: company.id }
    });

    if (existingFunnel) {
      console.log('ℹ️ CRM data already exists, skipping...');
      return;
    }

    // 1. Crear Funnels de ejemplo
    const salesFunnel = funnelRepository.create({
      name: 'Proceso de Ventas Principal',
      description: 'Funnel principal para leads de ventas',
      companyId: company.id,
      isActive: true,
    });

    const marketingFunnel = funnelRepository.create({
      name: 'Leads de Marketing Digital',
      description: 'Leads generados por campañas de marketing',
      companyId: company.id,
      isActive: true,
    });

    await funnelRepository.save([salesFunnel, marketingFunnel]);
    console.log('✅ Created funnels');

    // 2. Crear Stages para el funnel principal
    const salesStages = [
      { name: 'Nuevo Lead', color: '#E3F2FD', order: 1 },
      { name: 'Contactado', color: '#BBDEFB', order: 2 },
      { name: 'Calificado', color: '#90CAF9', order: 3 },
      { name: 'Propuesta', color: '#64B5F6', order: 4 },
      { name: 'Negociación', color: '#42A5F5', order: 5 },
      { name: 'Ganado', color: '#4CAF50', order: 6 },
    ];

    const salesStageEntities = salesStages.map(stage =>
      stageRepository.create({
        ...stage,
        funnelId: salesFunnel.id,
      })
    );

    await stageRepository.save(salesStageEntities);

    // 3. Crear Stages para el funnel de marketing
    const marketingStages = [
      { name: 'Suscriptor', color: '#FFF3E0', order: 1 },
      { name: 'Interesado', color: '#FFE0B2', order: 2 },
      { name: 'MQL', color: '#FFCC80', order: 3 },
      { name: 'SQL', color: '#FFB74D', order: 4 },
      { name: 'Cliente', color: '#FF9800', order: 5 },
    ];

    const marketingStageEntities = marketingStages.map(stage =>
      stageRepository.create({
        ...stage,
        funnelId: marketingFunnel.id,
      })
    );

    await stageRepository.save(marketingStageEntities);

    // 4. Crear Leads de ejemplo
    const sampleLeads = [
      {
        name: 'Juan Pérez',
        companyName: 'Tech Solutions SAS',
        email: 'juan.perez@techsolutions.com',
        phone: '3001234567',
        countryCode: '+57',
        sector: LeadSector.TECHNOLOGY,
        value: 15000000,
        notes: 'Interesado en automatización de procesos',
        funnelId: salesFunnel.id,
        stageId: salesStageEntities[1].id, // Contactado
        source: 'Website',
      },
      {
        name: 'María González',
        companyName: 'Clínica San Rafael',
        email: 'maria.gonzalez@clinicasanrafael.com',
        phone: '3007654321',
        countryCode: '+57',
        sector: LeadSector.HEALTHCARE,
        value: 25000000,
        notes: 'Necesita CRM para gestión de pacientes',
        funnelId: salesFunnel.id,
        stageId: salesStageEntities[2].id, // Calificado
        source: 'Referido',
      },
      {
        name: 'Carlos Rodríguez',
        companyName: 'Banco Nacional',
        email: 'carlos.rodriguez@banconacional.com',
        phone: '3009876543',
        countryCode: '+57',
        sector: LeadSector.FINANCE,
        value: 50000000,
        notes: 'Proyecto de transformación digital',
        funnelId: salesFunnel.id,
        stageId: salesStageEntities[3].id, // Propuesta
        source: 'LinkedIn',
      },
      {
        name: 'Ana Martínez',
        companyName: 'Universidad Central',
        email: 'ana.martinez@unicentral.edu.co',
        phone: '3001122334',
        countryCode: '+57',
        sector: LeadSector.EDUCATION,
        value: 8000000,
        notes: 'Plataforma educativa virtual',
        funnelId: marketingFunnel.id,
        stageId: marketingStageEntities[1].id, // Interesado
        source: 'Campaña Google Ads',
      },
      {
        name: 'Roberto Silva',
        companyName: 'Textiles del Norte',
        email: 'roberto.silva@textilesdn.com',
        phone: '3005544332',
        countryCode: '+57',
        sector: LeadSector.MANUFACTURING,
        value: 12000000,
        notes: 'Control de inventarios y producción',
        funnelId: marketingFunnel.id,
        stageId: marketingStageEntities[2].id, // MQL
        source: 'Feria Industrial',
      },
      {
        name: 'Laura Jiménez',
        companyName: 'Constructora El Dorado',
        email: 'laura.jimenez@eldorado.com',
        phone: '3002233445',
        countryCode: '+57',
        sector: LeadSector.REAL_ESTATE,
        value: 35000000,
        notes: 'Gestión de proyectos inmobiliarios',
        funnelId: salesFunnel.id,
        stageId: salesStageEntities[0].id, // Nuevo Lead
        source: 'Evento',
      },
    ];

    const leadEntities = sampleLeads.map(lead =>
      leadRepository.create({
        ...lead,
        companyId: company.id,
        lastContactAt: new Date(),
      })
    );

    await leadRepository.save(leadEntities);

    console.log('✅ CRM data seeded successfully!');
    console.log(`📊 Created ${await funnelRepository.count()} funnels`);
    console.log(`📋 Created ${await stageRepository.count()} stages`);
    console.log(`👥 Created ${await leadRepository.count()} leads`);
  }
}
