import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCompaniesAndUpdateUsers1774008123965 implements MigrationInterface {
    name = 'AddCompaniesAndUpdateUsers1774008123965'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "companies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "country" character varying NOT NULL, "department" character varying NOT NULL, "city" character varying NOT NULL, "address" character varying, "phone" character varying, "website" character varying, "description" character varying, "chamberOfCommerceUrl" character varying, "rutUrl" character varying, "legalRepresentativeIdUrl" character varying, "legalRepresentativeName" character varying, "legalRepresentativeId" character varying, "isActive" boolean NOT NULL DEFAULT true, "termsAccepted" boolean NOT NULL DEFAULT false, "termsAcceptedAt" TIMESTAMP, CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" ADD "companyId" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_6f9395c9037632a31107c8a9e58" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_6f9395c9037632a31107c8a9e58"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "companyId"`);
        await queryRunner.query(`DROP TABLE "companies"`);
    }

}
