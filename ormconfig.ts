import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USERNAME || 'jhoncuervo',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'neuroagentes',
  entities: [
    process.env.NODE_ENV === 'production'
      ? 'dist/src/**/*.entity.js'
      : 'src/**/*.entity.ts',
  ],
  migrations: [
    process.env.NODE_ENV === 'production'
      ? 'dist/src/migrations/*.js'
      : 'src/migrations/*.ts',
  ],
  synchronize: false, // Disable sync to use migrations only
  logging: process.env.NODE_ENV === 'development',
});
