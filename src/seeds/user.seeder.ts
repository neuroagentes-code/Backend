import { DataSource } from 'typeorm';
import { User, UserRole, UserArea } from '../auth/entities/user.entity';
import * as bcrypt from 'bcryptjs';

export class UserSeeder {
  constructor(private readonly dataSource: DataSource) {}

  async run(): Promise<void> {
    const userRepository = this.dataSource.getRepository(User);

    // Verificar si ya existen usuarios
    const existingUsers = await userRepository.count();
    if (existingUsers > 0) {
      console.log('Los usuarios ya existen, omitiendo seeding...');
      return;
    }

    // Crear Super Admin
    const superAdmin = userRepository.create({
      email: 'admin@neuroagentes.co',
      password: await bcrypt.hash('SuperAdmin2024!', 12),
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      area: UserArea.OPERATIONS,
      isActive: true,
      permissions: {
        agents: { view: true, create: true, edit: true, delete: true },
        integrations: { view: true, create: true, edit: true, delete: true },
        channels: { view: true, create: true, edit: true, delete: true },
        users: { view: true, create: true, edit: true, delete: true },
        subscriptions: { view: true, create: true, edit: true, delete: true },
        profile: { view: true, create: true, edit: true, delete: true },
      },
    });

    // Crear Admin
    const admin = userRepository.create({
      email: 'admin.comercial@neuroagentes.co',
      password: await bcrypt.hash('Admin2024!', 12),
      firstName: 'Admin',
      lastName: 'Comercial',
      role: UserRole.ADMIN,
      area: UserArea.COMMERCIAL,
      isActive: true,
      permissions: {
        agents: { view: true, create: true, edit: true, delete: false },
        integrations: { view: true, create: true, edit: true, delete: false },
        channels: { view: true, create: true, edit: true, delete: false },
        users: { view: true, create: true, edit: true, delete: false },
        subscriptions: { view: true, create: false, edit: false, delete: false },
        profile: { view: true, create: false, edit: true, delete: false },
      },
    });

    // Crear Manager
    const manager = userRepository.create({
      email: 'manager.ventas@neuroagentes.co',
      password: await bcrypt.hash('Manager2024!', 12),
      firstName: 'Manager',
      lastName: 'Ventas',
      role: UserRole.MANAGER,
      area: UserArea.COMMERCIAL,
      isActive: true,
      permissions: {
        agents: { view: true, create: true, edit: true, delete: false },
        integrations: { view: true, create: false, edit: false, delete: false },
        channels: { view: true, create: true, edit: true, delete: false },
        users: { view: true, create: false, edit: false, delete: false },
        subscriptions: { view: true, create: false, edit: false, delete: false },
        profile: { view: true, create: false, edit: true, delete: false },
      },
    });

    // Crear Usuario Regular
    const user = userRepository.create({
      email: 'usuario.demo@neuroagentes.co',
      password: await bcrypt.hash('User2024!', 12),
      firstName: 'Usuario',
      lastName: 'Demo',
      role: UserRole.USER,
      area: UserArea.CUSTOMER_SERVICE,
      isActive: true,
      permissions: {
        agents: { view: false, create: false, edit: false, delete: false },
        integrations: { view: false, create: false, edit: false, delete: false },
        channels: { view: false, create: false, edit: false, delete: false },
        users: { view: false, create: false, edit: false, delete: false },
        subscriptions: { view: false, create: false, edit: false, delete: false },
        profile: { view: true, create: false, edit: true, delete: false },
      },
    });

    await userRepository.save([superAdmin, admin, manager, user]);

    console.log('Usuarios seeded exitosamente:');
    console.log('- Super Admin: admin@neuroagentes.co / SuperAdmin2024!');
    console.log('- Admin Comercial: admin.comercial@neuroagentes.co / Admin2024!');
    console.log('- Manager Ventas: manager.ventas@neuroagentes.co / Manager2024!');
    console.log('- Usuario Demo: usuario.demo@neuroagentes.co / User2024!');
  }
}
