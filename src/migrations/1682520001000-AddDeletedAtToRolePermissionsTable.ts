import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDeletedAtToRolePermissionsTable1682520001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'role_permissions',
      new TableColumn({
        name: 'deletedAt',
        type: 'timestamp',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('role_permissions', 'deletedAt');
  }
}
