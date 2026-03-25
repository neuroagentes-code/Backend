import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { RegistrationController } from './registration.controller';
import { AuthModule } from '../auth/auth.module';
import { FileUploadService } from '../common/services/file-upload.service';
import { diskStorage } from 'multer';

@Module({
  imports: [
    AuthModule,
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads/temp',
      }),
    }),
  ],
  controllers: [RegistrationController],
  providers: [FileUploadService],
})
export class RegistrationModule {}
