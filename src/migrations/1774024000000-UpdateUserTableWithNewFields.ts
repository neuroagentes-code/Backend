import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserTableWithNewFields1774024000000 implements MigrationInterface {
    name = 'UpdateUserTableWithNewFields1774024000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Añadir nuevos campos a la tabla users
        await queryRunner.query(`ALTER TABLE "users" ADD "phone" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "countryCode" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "profileImage" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "area" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "permissions" jsonb DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "deletedAt" TIMESTAMP`);
        
        // Actualizar enum de roles
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('super_admin', 'admin', 'manager', 'user')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum_old"`);

        // Crear enum para areas
        await queryRunner.query(`CREATE TYPE "public"."users_area_enum" AS ENUM('commercial', 'technology', 'marketing', 'customer_service', 'operations', 'hr')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "area" TYPE "public"."users_area_enum" USING "area"::"text"::"public"."users_area_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revertir enum de area
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "area" TYPE character varying`);
        await queryRunner.query(`DROP TYPE "public"."users_area_enum"`);
        
        // Revertir enum de roles
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum_old" AS ENUM('admin', 'user')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum_old" USING "role"::"text"::"public"."users_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum_old" RENAME TO "users_role_enum"`);

        // Eliminar nuevos campos
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "permissions"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "area"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "profileImage"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "countryCode"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone"`);
    }
}
