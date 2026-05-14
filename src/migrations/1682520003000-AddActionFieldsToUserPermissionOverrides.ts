import { MigrationInterface, QueryRunner } from "typeorm";

export class AddActionFieldsToUserPermissionOverrides1682520003000 implements MigrationInterface {
    name = 'AddActionFieldsToUserPermissionOverrides1682520003000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_permission_overrides" ADD "can_view" boolean`);
        await queryRunner.query(`ALTER TABLE "user_permission_overrides" ADD "can_create" boolean`);
        await queryRunner.query(`ALTER TABLE "user_permission_overrides" ADD "can_edit" boolean`);
        await queryRunner.query(`ALTER TABLE "user_permission_overrides" ADD "can_delete" boolean`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_permission_overrides" DROP COLUMN "can_delete"`);
        await queryRunner.query(`ALTER TABLE "user_permission_overrides" DROP COLUMN "can_edit"`);
        await queryRunner.query(`ALTER TABLE "user_permission_overrides" DROP COLUMN "can_create"`);
        await queryRunner.query(`ALTER TABLE "user_permission_overrides" DROP COLUMN "can_view"`);
    }
}
