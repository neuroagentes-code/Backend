import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { RegistrationModule } from './registration/registration.module';
import { UsersModule } from './users/users.module';
import { CrmModule } from './crm/crm.module';
import { ClientsModule } from './clients/clients.module';
import { RolePermissionsModule } from './common/module';
import configuration from './config/configuration';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),
    
    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Disable synchronization to use migrations only
        logging: configService.get('app.nodeEnv') === 'development',
      }),
      inject: [ConfigService],
    }),
    
    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get('throttle.ttl'),
            limit: configService.get('throttle.limit'),
          },
        ],
      }),
      inject: [ConfigService],
    }),
    
    // Feature modules
    AuthModule,
    CompaniesModule,
    RegistrationModule,
    UsersModule,
    CrmModule,
    ClientsModule,
    RolePermissionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
