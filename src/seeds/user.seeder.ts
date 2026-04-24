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
    });

    await userRepository.save([superAdmin, admin, manager, user]);

    console.log('Usuarios seeded exitosamente:');
    console.log('- Super Admin: admin@neuroagentes.co / SuperAdmin2024!');
    console.log('- Admin Comercial: admin.comercial@neuroagentes.co / Admin2024!');
    console.log('- Manager Ventas: manager.ventas@neuroagentes.co / Manager2024!');
    console.log('- Usuario Demo: usuario.demo@neuroagentes.co / User2024!');
  }
}
