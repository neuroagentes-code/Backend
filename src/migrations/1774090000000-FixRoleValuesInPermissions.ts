import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixRoleValuesInPermissions1774090000000 implements MigrationInterface {
    name = 'FixRoleValuesInPermissions1774090000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 🔧 Corregir valores de roles para que coincidan con el enum UserRole
        await queryRunner.query(`
            UPDATE "role_permissions" 
            SET "role" = 'super_admin' 
            WHERE "role" = 'SUPER_ADMIN'
        `);
        
        await queryRunner.query(`
            UPDATE "role_permissions" 
            SET "role" = 'admin' 
            WHERE "role" = 'ADMIN'
        `);
        
        await queryRunner.query(`
            UPDATE "role_permissions" 
            SET "role" = 'manager' 
            WHERE "role" = 'MANAGER'
        `);
        
        await queryRunner.query(`
            UPDATE "role_permissions" 
            SET "role" = 'user' 
            WHERE "role" = 'USER'
        `);
        
        console.log('✅ Valores de roles corregidos para coincidir con UserRole enum');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 🔄 Revertir cambios
        await queryRunner.query(`
            UPDATE "role_permissions" 
            SET "role" = 'SUPER_ADMIN' 
            WHERE "role" = 'super_admin'
        `);
        
        await queryRunner.query(`
            UPDATE "role_permissions" 
            SET "role" = 'ADMIN' 
            WHERE "role" = 'admin'
        `);
        
        await queryRunner.query(`
            UPDATE "role_permissions" 
            SET "role" = 'MANAGER' 
            WHERE "role" = 'manager'
        `);
        
        await queryRunner.query(`
            UPDATE "role_permissions" 
            SET "role" = 'USER' 
            WHERE "role" = 'user'
        `);
        
        console.log('❌ Valores de roles revertidos');
    }
}