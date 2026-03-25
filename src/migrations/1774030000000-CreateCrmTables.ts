import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateCrmTables1774030000000 implements MigrationInterface {
  name = 'CreateCrmTables1774030000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla funnels
    await queryRunner.createTable(
      new Table({
        name: 'funnels',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'company_id',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    // Crear tabla stages
    await queryRunner.createTable(
      new Table({
        name: 'stages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'color',
            type: 'varchar',
            length: '7', // Para colores hex #FFFFFF
          },
          {
            name: 'order',
            type: 'integer',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'funnel_id',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    // Crear tabla leads
    await queryRunner.createTable(
      new Table({
        name: 'leads',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'company_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'country_code',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'sector',
            type: 'enum',
            enum: [
              'technology',
              'healthcare',
              'finance',
              'education',
              'retail',
              'manufacturing',
              'real_estate',
              'consulting',
              'other'
            ],
            isNullable: true,
          },
          {
            name: 'value',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'source',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'last_contact_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'company_id',
            type: 'uuid',
          },
          {
            name: 'assigned_user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'funnel_id',
            type: 'uuid',
          },
          {
            name: 'stage_id',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    // Crear foreign keys
    // Funnel -> Company
    await queryRunner.createForeignKey(
      'funnels',
      new TableForeignKey({
        columnNames: ['company_id'],
        referencedTableName: 'companies',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Stage -> Funnel
    await queryRunner.createForeignKey(
      'stages',
      new TableForeignKey({
        columnNames: ['funnel_id'],
        referencedTableName: 'funnels',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Lead -> Company
    await queryRunner.createForeignKey(
      'leads',
      new TableForeignKey({
        columnNames: ['company_id'],
        referencedTableName: 'companies',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Lead -> User (assigned)
    await queryRunner.createForeignKey(
      'leads',
      new TableForeignKey({
        columnNames: ['assigned_user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Lead -> Funnel
    await queryRunner.createForeignKey(
      'leads',
      new TableForeignKey({
        columnNames: ['funnel_id'],
        referencedTableName: 'funnels',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Lead -> Stage
    await queryRunner.createForeignKey(
      'leads',
      new TableForeignKey({
        columnNames: ['stage_id'],
        referencedTableName: 'stages',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Crear índices para mejor performance
    await queryRunner.query(`CREATE INDEX "IDX_funnels_company_id" ON "funnels" ("company_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_stages_funnel_id" ON "stages" ("funnel_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_stages_order" ON "stages" ("funnel_id", "order")`);
    await queryRunner.query(`CREATE INDEX "IDX_leads_company_id" ON "leads" ("company_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_leads_funnel_id" ON "leads" ("funnel_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_leads_stage_id" ON "leads" ("stage_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_leads_assigned_user_id" ON "leads" ("assigned_user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_leads_email" ON "leads" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_leads_active" ON "leads" ("is_active", "company_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.query(`DROP INDEX "IDX_leads_active"`);
    await queryRunner.query(`DROP INDEX "IDX_leads_email"`);
    await queryRunner.query(`DROP INDEX "IDX_leads_assigned_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_leads_stage_id"`);
    await queryRunner.query(`DROP INDEX "IDX_leads_funnel_id"`);
    await queryRunner.query(`DROP INDEX "IDX_leads_company_id"`);
    await queryRunner.query(`DROP INDEX "IDX_stages_order"`);
    await queryRunner.query(`DROP INDEX "IDX_stages_funnel_id"`);
    await queryRunner.query(`DROP INDEX "IDX_funnels_company_id"`);

    // Eliminar foreign keys
    const leadTable = await queryRunner.getTable('leads');
    const stageFk = leadTable.foreignKeys.find(fk => fk.columnNames.includes('stage_id'));
    const funnelFk = leadTable.foreignKeys.find(fk => fk.columnNames.includes('funnel_id'));
    const assignedUserFk = leadTable.foreignKeys.find(fk => fk.columnNames.includes('assigned_user_id'));
    const leadCompanyFk = leadTable.foreignKeys.find(fk => fk.columnNames.includes('company_id'));
    
    if (stageFk) await queryRunner.dropForeignKey('leads', stageFk);
    if (funnelFk) await queryRunner.dropForeignKey('leads', funnelFk);
    if (assignedUserFk) await queryRunner.dropForeignKey('leads', assignedUserFk);
    if (leadCompanyFk) await queryRunner.dropForeignKey('leads', leadCompanyFk);

    const stageTable = await queryRunner.getTable('stages');
    const stageFunnelFk = stageTable.foreignKeys.find(fk => fk.columnNames.includes('funnel_id'));
    if (stageFunnelFk) await queryRunner.dropForeignKey('stages', stageFunnelFk);

    const funnelTable = await queryRunner.getTable('funnels');
    const funnelCompanyFk = funnelTable.foreignKeys.find(fk => fk.columnNames.includes('company_id'));
    if (funnelCompanyFk) await queryRunner.dropForeignKey('funnels', funnelCompanyFk);

    // Eliminar tablas
    await queryRunner.dropTable('leads');
    await queryRunner.dropTable('stages');
    await queryRunner.dropTable('funnels');
  }
}
