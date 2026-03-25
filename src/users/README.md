# Módulo de Usuarios - API Documentation

## Descripción General

El módulo de usuarios de NeuroAgentes permite la gestión completa del equipo de trabajo, incluyendo la creación, edición, eliminación de cuentas y el control granular de permisos por módulo del sistema.

## Características Principales

### 🔐 Sistema de Roles
- **SUPER_ADMIN**: Acceso completo a todas las funcionalidades
- **ADMIN**: Gestión avanzada con restricciones en eliminaciones
- **MANAGER**: Supervisión y gestión limitada
- **USER**: Acceso básico solo al perfil propio

### 🏢 Áreas de Trabajo
- **COMMERCIAL**: Comercial y ventas
- **TECHNOLOGY**: Tecnología y desarrollo  
- **MARKETING**: Marketing y comunicaciones
- **CUSTOMER_SERVICE**: Atención al cliente
- **OPERATIONS**: Operaciones
- **HR**: Recursos humanos

### 🎯 Sistema de Permisos Granular
Cada usuario puede tener permisos específicos por módulo:
- **Agentes**: Ver, crear, editar, eliminar
- **Integraciones**: Ver, crear, editar, eliminar
- **Canales**: Ver, crear, editar, eliminar
- **Usuarios**: Ver, crear, editar, eliminar
- **Suscripciones**: Ver, crear, editar, eliminar
- **Perfil**: Ver, crear, editar, eliminar

## API Endpoints

### 🔍 GET /api/users
Obtener lista paginada de usuarios con filtros

**Query Parameters:**
- `page` (number): Página actual (default: 1)
- `limit` (number): Registros por página (default: 10)
- `search` (string): Búsqueda por nombre, apellido o email
- `role` (UserRole): Filtrar por rol
- `area` (UserArea): Filtrar por área
- `isActive` (boolean): Filtrar por estado activo/inactivo
- `companyId` (string): Filtrar por empresa

**Respuesta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "phone": "+57123456789",
      "countryCode": "+57",
      "profileImage": "https://...",
      "role": "admin",
      "area": "commercial",
      "isActive": true,
      "permissions": { ... },
      "company": { ... },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "hasNextPage": true,
  "hasPrevPage": false
}
```

### 👤 GET /api/users/:id
Obtener un usuario por ID

**Respuesta:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  // ... resto de campos del usuario
}
```

### ➕ POST /api/users
Crear un nuevo usuario

**Content-Type:** `multipart/form-data`

**Body:**
```json
{
  "email": "nuevo@example.com",
  "firstName": "Nuevo",
  "lastName": "Usuario",
  "phone": "123456789",
  "countryCode": "+57",
  "role": "user",
  "area": "commercial",
  "isActive": true,
  "permissions": {
    "agents": { "view": true, "create": false, "edit": false, "delete": false },
    // ... otros módulos
  },
  "companyId": "uuid"
}
```

**Archivos:**
- `profileImage` (opcional): Imagen de perfil (jpg, jpeg, png, gif - máx. 5MB)

**Respuesta:** Usuario creado (201)

### ✏️ PATCH /api/users/:id
Actualizar un usuario

**Content-Type:** `multipart/form-data`

**Body:** Campos a actualizar (parcial)

### 🔄 PATCH /api/users/:id/toggle-status
Cambiar estado activo/inactivo del usuario

**Respuesta:** Usuario actualizado

### 🛡️ PATCH /api/users/:id/permissions
Actualizar permisos específicos del usuario

**Body:**
```json
{
  "agents": { "view": true, "create": true, "edit": true, "delete": false },
  "integrations": { "view": true, "create": false, "edit": false, "delete": false }
  // ... otros módulos
}
```

### 🗑️ DELETE /api/users/:id
Eliminar usuario (soft delete)

**Respuesta:**
```json
{
  "message": "Usuario eliminado exitosamente"
}
```

## Autenticación y Autorización

### Headers Requeridos
```
Authorization: Bearer <jwt-token>
```

### Permisos Necesarios
- **Ver usuarios**: `users.view`
- **Crear usuarios**: `users.create`  
- **Editar usuarios**: `users.edit`
- **Eliminar usuarios**: `users.delete`

Los Super Admins tienen acceso automático a todas las operaciones.

## Seguridad

### ✅ Validaciones Implementadas
- Email único en el sistema
- Validación de formato de imagen (jpg, jpeg, png, gif)
- Tamaño máximo de imagen: 5MB
- Validación de roles y áreas válidos
- Hash seguro de contraseñas (bcrypt)

### 🔒 Características de Seguridad
- **Soft Delete**: Los usuarios eliminados mantienen trazabilidad
- **Middleware de Autorización**: Verificación automática de permisos
- **Contraseñas Temporales**: Generación automática para nuevos usuarios
- **Email de Bienvenida**: Envío automático de credenciales

## Códigos de Respuesta

| Código | Descripción |
|--------|-------------|
| 200 | Operación exitosa |
| 201 | Usuario creado exitosamente |
| 400 | Datos inválidos o formato de archivo incorrecto |
| 401 | No autenticado |
| 403 | Sin permisos suficientes |
| 404 | Usuario no encontrado |
| 409 | Email ya registrado |

## Ejemplos de Uso

### Buscar usuarios por nombre
```
GET /api/users?search=john&page=1&limit=5
```

### Filtrar usuarios activos del área comercial
```
GET /api/users?area=commercial&isActive=true
```

### Crear usuario con imagen
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer <token>" \
  -F "email=nuevo@example.com" \
  -F "firstName=Nuevo" \
  -F "lastName=Usuario" \
  -F "role=user" \
  -F "profileImage=@/path/to/image.jpg"
```

## Estructura de Base de Datos

### Tabla: users
- `id`: UUID (Primary Key)
- `email`: String (Unique)
- `password`: String (Hashed)
- `firstName`: String
- `lastName`: String  
- `phone`: String (Nullable)
- `countryCode`: String (Nullable)
- `profileImage`: String (Nullable)
- `role`: Enum (UserRole)
- `area`: Enum (UserArea, Nullable)
- `isActive`: Boolean (Default: true)
- `permissions`: JSONB
- `companyId`: UUID (Foreign Key, Nullable)
- `createdAt`: Timestamp
- `updatedAt`: Timestamp
- `deletedAt`: Timestamp (Nullable - Soft Delete)

## Migración y Setup

### Ejecutar Migración
```bash
npm run migration:run
```

### Seed Usuarios Iniciales
```bash
npm run seed
```

Esto creará usuarios de prueba:
- Super Admin: `admin@neuroagentes.co / SuperAdmin2024!`
- Admin Comercial: `admin.comercial@neuroagentes.co / Admin2024!`
- Manager Ventas: `manager.ventas@neuroagentes.co / Manager2024!`
- Usuario Demo: `usuario.demo@neuroagentes.co / User2024!`
