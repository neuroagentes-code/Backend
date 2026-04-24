import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRolePermissionsTable1774070000000 implements MigrationInterface {
    name = 'CreateRolePermissionsTable1774070000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 🏗️ Crear tabla role_permissions
        await queryRunner.query(`
            CREATE TABLE "role_permissions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "role" character varying NOT NULL,
                "module" character varying(50) NOT NULL,
                "can_view" boolean NOT NULL DEFAULT false,
                "can_create" boolean NOT NULL DEFAULT false,
                "can_edit" boolean NOT NULL DEFAULT false,
                "can_delete" boolean NOT NULL DEFAULT false,
                "description" character varying(500),
                "is_active" boolean NOT NULL DEFAULT true,
                "created_by" character varying,
                "updated_by" character varying,
                CONSTRAINT "PK_role_permissions" PRIMARY KEY ("id")
            )
        `);

        // 🚀 Crear índice único para rol/módulo
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_role_permissions_role_module" 
            ON "role_permissions" ("role", "module")
        `);

        // 📊 Insertar permisos por defecto para todos los roles y módulos
        const modules = ['agents', 'integrations', 'channels', 'users', 'subscriptions', 'profile'];
        
        // 👑 SUPER_ADMIN: Todos los permisos en todos los módulos
        for (const module of modules) {
            await queryRunner.query(`
                INSERT INTO "role_permissions" 
                ("role", "module", "can_view", "can_create", "can_edit", "can_delete", "description", "created_by")
                VALUES 
                ('SUPER_ADMIN', '${module}', true, true, true, true, 'Permisos completos para Super Administrador', 'SYSTEM')
            `);
        }

        // 🛠️ ADMIN: Casi todos los permisos excepto eliminar usuarios críticos
        const adminPermissions = {
            agents: { view: true, create: true, edit: true, delete: true },
            integrations: { view: true, create: true, edit: true, delete: true },
            channels: { view: true, create: true, edit: true, delete: true },
            users: { view: true, create: true, edit: true, delete: false }, // No puede eliminar usuarios
            subscriptions: { view: true, create: true, edit: true, delete: false },
            profile: { view: true, create: false, edit: true, delete: false }
        };

        for (const [module, perms] of Object.entries(adminPermissions)) {
            await queryRunner.query(`
                INSERT INTO "role_permissions" 
                ("role", "module", "can_view", "can_create", "can_edit", "can_delete", "description", "created_by")
                VALUES 
                ('ADMIN', '${module}', ${perms.view}, ${perms.create}, ${perms.edit}, ${perms.delete}, 'Permisos de Administrador para ${module}', 'SYSTEM')
            `);
        }

        // 📈 MANAGER: Permisos de gestión operativa
        const managerPermissions = {
            agents: { view: true, create: true, edit: true, delete: false },
            integrations: { view: true, create: false, edit: true, delete: false },
            channels: { view: true, create: true, edit: true, delete: false },
            users: { view: true, create: false, edit: false, delete: false }, // Solo visualización de usuarios
            subscriptions: { view: true, create: false, edit: false, delete: false },
            profile: { view: true, create: false, edit: true, delete: false }
        };

        for (const [module, perms] of Object.entries(managerPermissions)) {
            await queryRunner.query(`
                INSERT INTO "role_permissions" 
                ("role", "module", "can_view", "can_create", "can_edit", "can_delete", "description", "created_by")
                VALUES 
                ('MANAGER', '${module}', ${perms.view}, ${perms.create}, ${perms.edit}, ${perms.delete}, 'Permisos de Manager para ${module}', 'SYSTEM')
            `);
        }

        // 👤 USER: Permisos básicos solo lectura y perfil propio
        const userPermissions = {
            agents: { view: true, create: false, edit: false, delete: false },
            integrations: { view: false, create: false, edit: false, delete: false },
            channels: { view: true, create: false, edit: false, delete: false },
            users: { view: false, create: false, edit: false, delete: false }, // No acceso a usuarios
            subscriptions: { view: false, create: false, edit: false, delete: false },
            profile: { view: true, create: false, edit: true, delete: false } // Solo su propio perfil
        };

        for (const [module, perms] of Object.entries(userPermissions)) {
            await queryRunner.query(`
                INSERT INTO "role_permissions" 
                ("role", "module", "can_view", "can_create", "can_edit", "can_delete", "description", "created_by")
                VALUES 
                ('USER', '${module}', ${perms.view}, ${perms.create}, ${perms.edit}, ${perms.delete}, 'Permisos de Usuario básico para ${module}', 'SYSTEM')
            `);
        }

        console.log('✅ Tabla role_permissions creada con permisos por defecto');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 🗑️ Eliminar índice único
        await queryRunner.query(`DROP INDEX "IDX_role_permissions_role_module"`);
        
        // 🗑️ Eliminar tabla
        await queryRunner.query(`DROP TABLE "role_permissions"`);
        
        console.log('❌ Tabla role_permissions eliminada');
    }
}