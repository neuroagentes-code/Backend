import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUserTable1710864000000 implements MigrationInterface {
  name = 'CreateUserTable1710864000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'password',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'firstName',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'lastName',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['admin', 'user'],
            default: "'user'",
            isNullable: false,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
    );

    // Create composite index for email lookups (unique constraint is already handled by column definition)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_users_email" ON "users" ("email")`);

    // Create index for active user filtering
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_users_isActive" ON "users" ("isActive")`);

    // Insert default admin user for BackOffice access
    // Note: Change this password in production environment!
    // Default credentials: admin@neuroagentes.co / Admin123!
    await queryRunner.query(`
      INSERT INTO users (email, password, "firstName", "lastName", role, "isActive")
      VALUES ('admin@neuroagentes.co', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewjyD7jK7VG8WxW6', 'Admin', 'NeuroAgentes', 'admin', true)
      ON CONFLICT (email) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_isActive"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_email"`);
    
    // Drop table
    await queryRunner.dropTable('users');
  }
}
