import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreatedByToUsersTable1682520002000 implements MigrationInterface {
  name = 'AddCreatedByToUsersTable1682520002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "createdById" uuid`);
    await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_createdBy" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_createdBy"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "createdById"`);
  }
}
