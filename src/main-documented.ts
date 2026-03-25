import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS configuration for BackOffice
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger API Documentation
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

### Flujo de Autenticación
1. **Registro**: Los usuarios pueden registrarse con email, contraseña, nombre y apellido
2. **Login**: Autenticación con email y contraseña
3. **Acceso Protegido**: Uso del token JWT para acceder a recursos protegidos

### Credenciales de Prueba
- **Email**: admin@neuroagentes.co
- **Password**: Admin123!

### Estados de Respuesta
- **200**: Operación exitosa
- **400**: Error de validación (campos vacíos, formato inválido)
- **401**: Credenciales incorrectas
- **409**: Usuario ya existe (registro)
- **429**: Límite de intentos excedido
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
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('BackOffice Authentication', 'Endpoints para autenticación en el BackOffice')
    .addServer('http://localhost:3000', 'Development Server')
    .addServer('https://api.neuroagentes.co', 'Production Server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'NeuroAgentes API Documentation',
    customfavIcon: 'https://neuroagentes.co/favicon.ico',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    ],
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 NeuroAgentes BackOffice API running on: ${await app.getUrl()}`);
  console.log(`📖 API Documentation available at: ${await app.getUrl()}/api/docs`);
}

bootstrap();
