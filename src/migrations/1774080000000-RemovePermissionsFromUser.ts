import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemovePermissionsFromUser1774080000000 implements MigrationInterface {
    name = 'RemovePermissionsFromUser1774080000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 🗑️ Eliminar columna permissions de la tabla users
        await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "permissions"
        `);
        
        console.log('✅ Columna permissions eliminada de la tabla users');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 🔄 Recrear columna permissions en caso de rollback
        await queryRunner.query(`
            ALTER TABLE "users" ADD "permissions" jsonb DEFAULT '{}'
        `);
        
        console.log('❌ Columna permissions restaurada en la tabla users');
    }
}