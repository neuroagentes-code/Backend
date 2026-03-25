import { 
  Controller, 
  Post, 
  Body, 
  UseInterceptors, 
  UploadedFiles,
  ValidationPipe,
  BadRequestException
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'node:path';
import { AuthService } from '../auth/auth.service';
import { CompleteRegistrationDto } from '../companies/dto/create-company.dto';
import { FileUploadService } from '../common/services/file-upload.service';
import { Public } from '../auth/decorators/auth.decorators';

// Configuración de multer para validar archivos
const multerOptions = {
  storage: diskStorage({
    destination: './uploads/temp',
    filename: (req, file, cb) => {
      const randomName = new Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
      cb(null, `${randomName}${extname(file.originalname)}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestException('Solo se permiten archivos PDF, JPG, JPEG y PNG'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 3, // Máximo 3 archivos
  },
};

@ApiTags('Company Registration')
@Controller('registration')
export class RegistrationController {
  constructor(
    private readonly authService: AuthService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Public()
  @Post('complete')
  @UseInterceptors(FilesInterceptor('documents', 3, multerOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Registro completo de empresa con documentos',
    description: `
    Wizard de 3 pasos para registrar una empresa:
    
    **Paso 1: Datos de la Empresa**
    - Nombre de la empresa (obligatorio)
    - País (por defecto: Colombia)
    - Departamento (obligatorio)
    - Ciudad (obligatorio)
    - Dirección, teléfono, sitio web (opcional)
    
    **Paso 2: Datos del Contacto Principal**
    - Email (obligatorio, formato válido)
    - Contraseña y confirmación (obligatorio, deben coincidir)
    - Nombre y apellido (obligatorio)
    - Teléfono y posición (opcional)
    
    **Paso 3: Documentos Legales**
    - Cámara de Comercio (opcional, PDF/JPG/PNG, máx 5MB)
    - RUT (opcional, PDF/JPG/PNG, máx 5MB)
    - Cédula del Representante Legal (opcional, PDF/JPG/PNG, máx 5MB)
    - Aceptación de términos y condiciones (obligatorio)
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Empresa registrada exitosamente',
    schema: {
      example: {
        message: 'Registro completado con éxito. Bienvenido a NeuroAgentes.'
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Datos inválidos, contraseñas no coinciden, archivo inválido o términos no aceptados',
    schema: {
      examples: {
        passwordMismatch: {
          summary: 'Contraseñas no coinciden',
          value: {
            statusCode: 400,
            message: 'Las contraseñas no coinciden',
            error: 'Bad Request'
          }
        },
        invalidFile: {
          summary: 'Archivo inválido',
          value: {
            statusCode: 400,
            message: 'Solo se permiten archivos PDF, JPG, JPEG y PNG',
            error: 'Bad Request'
          }
        },
        termsNotAccepted: {
          summary: 'Términos no aceptados',
          value: {
            statusCode: 400,
            message: 'Debe aceptar los términos y condiciones',
            error: 'Bad Request'
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Ya existe un usuario con este email',
    schema: {
      example: {
        statusCode: 409,
        message: 'Ya existe un usuario registrado con este email',
        error: 'Conflict'
      }
    }
  })
  async completeRegistration(
    @Body(ValidationPipe) registrationDto: CompleteRegistrationDto,
    @UploadedFiles() files?: Express.Multer.File[]
  ): Promise<{ message: string }> {
    
    // Validar que se aceptaron los términos y condiciones
    if (!registrationDto.company.termsAccepted) {
      throw new BadRequestException('Debe aceptar los términos y condiciones');
    }

    try {
      // Procesar archivos subidos si los hay
      const updatedRegistrationDto = await this.processUploadedFiles(registrationDto, files);
      
      // Procesar el registro completo
      return await this.authService.completeRegistration(updatedRegistrationDto);
    } catch (error) {
      // Limpiar archivos subidos en caso de error
      await this.cleanupFiles(files);
      throw error;
    }
  }

  private async processUploadedFiles(
    registrationDto: CompleteRegistrationDto,
    files?: Express.Multer.File[]
  ): Promise<CompleteRegistrationDto> {
    if (!files || files.length === 0) {
      return registrationDto;
    }

    const documentUrls: { [key: string]: string } = {};
    
    for (const file of files) {
      const uploadedUrl = await this.fileUploadService.uploadFile(file, 'legal-documents');
      this.assignDocumentUrl(file, documentUrls, uploadedUrl);
    }

    return {
      ...registrationDto,
      company: {
        ...registrationDto.company,
        ...documentUrls,
      },
    };
  }

  private assignDocumentUrl(
    file: Express.Multer.File,
    documentUrls: { [key: string]: string },
    uploadedUrl: string
  ): void {
    const fileName = file.originalname.toLowerCase();
    
    if (fileName.includes('camara') || fileName.includes('commerce')) {
      documentUrls.chamberOfCommerceUrl = uploadedUrl;
    } else if (fileName.includes('rut')) {
      documentUrls.rutUrl = uploadedUrl;
    } else if (fileName.includes('cedula') || fileName.includes('id')) {
      documentUrls.legalRepresentativeIdUrl = uploadedUrl;
    } else {
      // Asignar al primer campo disponible
      this.assignToFirstAvailableField(documentUrls, uploadedUrl);
    }
  }

  private assignToFirstAvailableField(
    documentUrls: { [key: string]: string },
    uploadedUrl: string
  ): void {
    if (!documentUrls.chamberOfCommerceUrl) {
      documentUrls.chamberOfCommerceUrl = uploadedUrl;
    } else if (!documentUrls.rutUrl) {
      documentUrls.rutUrl = uploadedUrl;
    } else if (!documentUrls.legalRepresentativeIdUrl) {
      documentUrls.legalRepresentativeIdUrl = uploadedUrl;
    }
  }

  private async cleanupFiles(files?: Express.Multer.File[]): Promise<void> {
    if (!files || files.length === 0) {
      return;
    }

    for (const file of files) {
      try {
        await this.fileUploadService.deleteFile(file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
  }
}
