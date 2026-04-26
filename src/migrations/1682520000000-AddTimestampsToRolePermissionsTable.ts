import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTimestampsToRolePermissionsTable1682520000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'role_permissions',
      new TableColumn({
        name: 'createdAt',
        type: 'timestamp',
        default: 'now()',
        isNullable: false,
      })
    );
    await queryRunner.addColumn(
      'role_permissions',
      new TableColumn({
        name: 'updatedAt',
        type: 'timestamp',
        default: 'now()',
        isNullable: false,
        onUpdate: 'CURRENT_TIMESTAMP',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('role_permissions', 'updatedAt');
    await queryRunner.dropColumn('role_permissions', 'createdAt');
  }
}
