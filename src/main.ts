import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix(`${configService.get('app.apiPrefix')}/${configService.get('app.apiVersion')}`);

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global interceptors
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector),
    new LoggingInterceptor(),
  );

  // Global filters
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger documentation
  if (configService.get('app.nodeEnv') !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    const config = new DocumentBuilder()
      .setTitle('NeuroAgentes BackOffice API')
      .setDescription(`
## NeuroAgentes BackOffice Authentication API

Esta API proporciona endpoints seguros para la autenticación de clientes en el BackOffice de NeuroAgentes.

### Características de Seguridad
- **Rate Limiting**: Protección contra ataques de fuerza bruta (5 intentos por minuto en login)
- **JWT Authentication**: Tokens seguros para sesiones autenticadas
- **Password Hashing**: Contraseñas encriptadas con bcrypt
- **Email Validation**: Validación de formato de correo electrónico
- **Error Handling**: Mensajes de error genéricos por seguridad

### Flujo de Autenticación BackOffice
1. **Login**: Cliente ingresa email y contraseña
2. **Validación**: Sistema verifica credenciales
3. **Token**: Se genera JWT para sesión autenticada
4. **Dashboard**: Redirección al panel principal

### Credenciales por Defecto (Cambiar en Producción)
- **Email**: admin@neuroagentes.co
- **Password**: Admin123!
      `)
      .setVersion('1.0.0')
      .setContact(
        'NeuroAgentes Support',
        'https://neuroagentes.co',
        'comercial@neuroagentes.co'
      )
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token obtained from /auth/login',
          in: 'header',
        },
        'JWT-auth'
      )
      .addTag('BackOffice Authentication', 'Endpoints para autenticación en el BackOffice')
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'NeuroAgentes BackOffice API',
      customfavIcon: 'https://neuroagentes.co/favicon.ico',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
      },
    });
  }

  const port = configService.get('app.port');
  await app.listen(port);
  
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger documentation: ${await app.getUrl()}/api/docs`);
}

bootstrap().catch((error) => {
  console.error('Application failed to start:', error);
  process.exit(1);
});
