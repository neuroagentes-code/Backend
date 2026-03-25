import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';

@Injectable()
export class FileUploadService {
  private s3: AWS.S3;

  constructor(private configService: ConfigService) {
    // Configurar AWS S3 (en caso de usar S3)
    this.s3 = new AWS.S3({
      accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.get('AWS_REGION') || 'us-east-1',
    });
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'documents'): Promise<string> {
    try {
      // Validar tipo de archivo
      const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedMimes.includes(file.mimetype)) {
        throw new BadRequestException('Tipo de archivo no permitido. Solo se permiten PDF, JPG, JPEG y PNG.');
      }

      // Validar tamaño (5MB máximo)
      const maxSize = 5 * 1024 * 1024; // 5MB en bytes
      if (file.size > maxSize) {
        throw new BadRequestException('El archivo no puede superar los 5MB.');
      }

      const bucketName = this.configService.get('AWS_S3_BUCKET_NAME');
      
      // Si no hay configuración de S3, guardar localmente
      if (!bucketName) {
        return this.saveFileLocally(file, folder);
      }

      // Generar nombre único para el archivo
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}-${file.originalname}`;

      const uploadResult = await this.s3
        .upload({
          Bucket: bucketName,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
          ServerSideEncryption: 'AES256',
        })
        .promise();

      return uploadResult.Location;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error uploading file:', error);
      throw new BadRequestException('Error al subir el archivo');
    }
  }

  private async saveFileLocally(file: Express.Multer.File, folder: string): Promise<string> {
    // Para desarrollo local - guardar en filesystem
    const fs = require('fs');
    const path = require('path');

    const uploadDir = path.join(process.cwd(), 'uploads', folder);
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${file.originalname}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, file.buffer);

    // Retornar URL relativa
    return `/uploads/${folder}/${fileName}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const bucketName = this.configService.get('AWS_S3_BUCKET_NAME');
      
      if (!bucketName || fileUrl.startsWith('/uploads/')) {
        // Archivo local
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(process.cwd(), fileUrl);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        return;
      }

      // Extraer la key del archivo de S3
      const url = new URL(fileUrl);
      const key = url.pathname.substring(1); // Remover el primer '/'

      await this.s3
        .deleteObject({
          Bucket: bucketName,
          Key: key,
        })
        .promise();
    } catch (error) {
      console.error('Error deleting file:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }
}
