import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { FileUploadService } from '../common/services/file-upload.service';

@Module({
  imports: [TypeOrmModule.forFeature([Company])],
  providers: [CompaniesService, FileUploadService],
  controllers: [CompaniesController],
  exports: [CompaniesService, TypeOrmModule],
})
export class CompaniesModule {}
