import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import * as fs from 'node:fs';
import { S3Config } from '../../config/configuration.interface';

@Injectable()
export class FileUploadService {
  private s3: AWS.S3;
  private s3Config: S3Config;

  constructor(private configService: ConfigService) {
    // Obtener configuración de S3
    this.s3Config = this.configService.get<S3Config>('aws');
    
    // Validar configuración de S3
    if (!this.isS3Configured()) {
      throw new Error('AWS S3 configuration is required. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET_NAME environment variables.');
    }

    // **OPTIMIZADO**: Configurar AWS S3 con parámetros de rendimiento
    this.s3 = new AWS.S3({
      accessKeyId: this.s3Config.accessKeyId,
      secretAccessKey: this.s3Config.secretAccessKey,
      region: this.s3Config.region,
      ...(this.s3Config.endpoint && { endpoint: this.s3Config.endpoint }),
      signatureVersion: 'v4',
      
      // **OPTIMIZADO**: Configuraciones de rendimiento
      maxRetries: 3,
      retryDelayOptions: {
        customBackoff: function(retryCount, err) {
          return Math.pow(2, retryCount) * 100; // Exponential backoff más agresivo
        }
      },
      httpOptions: {
        timeout: 120000, // 2 minutos timeout
        connectTimeout: 60000 // 1 minuto para conectar
      },
      
      // **OPTIMIZADO**: Pool de conexiones reutilizables
      s3ForcePathStyle: false, // Usar virtual hosted-style para mejor rendimiento
      useAccelerateEndpoint: false, // Cambiar a true si tienes Transfer Acceleration habilitado
    });
  }

  private isS3Configured(): boolean {
    return !!(
      this.s3Config?.accessKeyId && 
      this.s3Config?.secretAccessKey && 
      this.s3Config?.bucketName
    );
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'documents'): Promise<string> {
    try {
      // Validaciones tempranas y rápidas
      this.validateFile(file);

      return this.uploadToS3(file, folder);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error uploading file:', error);
      throw new BadRequestException('Error al subir el archivo');
    }
  }

  // Validación rápida sin processing pesado
  private validateFile(file: Express.Multer.File): void {
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de archivo no permitido. Solo se permiten PDF, JPG, JPEG y PNG.');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB en bytes
    if (file.size > maxSize) {
      throw new BadRequestException('El archivo no puede superar los 5MB.');
    }
  }

  private async uploadToS3(file: Express.Multer.File, folder: string): Promise<string> {
    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9\.-]/g, '_');
    const fileName = `${folder}/${timestamp}-${randomString}-${sanitizedFileName}`;

    // diskStorage no llena file.buffer; leer del disco si es necesario
    const body: Buffer | fs.ReadStream = file.buffer
      ? file.buffer
      : fs.createReadStream(file.path);

    const uploadParams = {
      Bucket: this.s3Config.bucketName,
      Key: fileName,
      Body: body,
      ContentType: file.mimetype,
      ACL: 'public-read',
      
      // **OPTIMIZADO**: Configuraciones para velocidad y rendimiento
      ServerSideEncryption: 'AES256',
      StorageClass: 'STANDARD', // Más rápido que STANDARD_IA para acceso inmediato
      
      Metadata: {
        originalName: file.originalname,
        uploadDate: new Date().toISOString(),
        fileSize: file.size.toString(),
      },
      
      // **OPTIMIZADO**: Headers de cache para CDN
      CacheControl: 'max-age=31536000', // 1 año
      ContentDisposition: `attachment; filename="${file.originalname}"`,
    };

    // **OPTIMIZADO**: Usar upload optimizado con configuración de velocidad
    const uploadOptions = {
      partSize: Math.max(5 * 1024 * 1024, file.size / 10), // Mínimo 5MB o 1/10 del archivo 
      queueSize: 4, // Subir hasta 4 partes en paralelo
      leavePartsOnError: false,
    };

    const uploadResult = await this.s3.upload(uploadParams, uploadOptions).promise();

    return uploadResult.Location;
  }



  async deleteFile(fileUrl: string): Promise<void> {
    try {
      await this.deleteFromS3(fileUrl);
    } catch (error) {
      console.error('Error deleting file:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  private async deleteFromS3(fileUrl: string): Promise<void> {
    try {
      // Extraer la key del archivo de S3
      const url = new URL(fileUrl);
      const key = url.pathname.substring(1); // Remover el primer '/'

      await this.s3.deleteObject({
        Bucket: this.s3Config.bucketName,
        Key: key,
      }).promise();
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      throw error;
    }
  }



  /**
   * Genera una URL firmada para acceso temporal a un archivo en S3
   */
  async getSignedUrl(fileUrl: string, expiresIn: number = 3600): Promise<string> {
    try {
      const url = new URL(fileUrl);
      const key = url.pathname.substring(1);

      const signedUrl = this.s3.getSignedUrl('getObject', {
        Bucket: this.s3Config.bucketName,
        Key: key,
        Expires: expiresIn, // Tiempo de expiración en segundos
      });

      return signedUrl;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new BadRequestException('Error generando URL de acceso al archivo');
    }
  }
}
