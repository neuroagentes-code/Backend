import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { UserSeeder } from './user.seeder';
import { CrmSeeder } from './crm.seeder';

// Load environment variables
dotenv.config();

async function runSeeders() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT) || 5432,
    username: process.env.DATABASE_USERNAME || 'jhoncuervo',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'neuroagentes',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established for seeding...');

    const userSeeder = new UserSeeder(dataSource);
    await userSeeder.run();

    const crmSeeder = new CrmSeeder(dataSource);
    await crmSeeder.seed();

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await dataSource.destroy();
  }
}

runSeeders()
  .then(() => {
    console.log('Seeding process finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
