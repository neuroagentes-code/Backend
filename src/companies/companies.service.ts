import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entities/company.entity';
import { CreateCompanyDto, CompanyResponseDto } from './dto/create-company.dto';
import { FileUploadService } from '../common/services/file-upload.service';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly fileUploadService: FileUploadService,
  ) {}

  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    const company = this.companyRepository.create(createCompanyDto);
    return await this.companyRepository.save(company);
  }

  async findAll(): Promise<CompanyResponseDto[]> {
    const companies = await this.companyRepository.find({
      relations: ['users'],
    });
    
    // Generar URLs firmadas para todas las empresas en paralelo
    return await Promise.all(
      companies.map(company => this.createCompanyResponseWithSignedUrls(company))
    );
  }

  async findOne(id: string): Promise<CompanyResponseDto | null> {
    const company = await this.companyRepository.findOne({
      where: { id },
      relations: ['users'],
    });
    
    if (!company) {
      return null;
    }
    
    return await this.createCompanyResponseWithSignedUrls(company);
  }

  async findByName(name: string): Promise<CompanyResponseDto | null> {
    const company = await this.companyRepository.findOne({
      where: { name },
      relations: ['users'],
    });
    
    if (!company) {
      return null;
    }
    
    return await this.createCompanyResponseWithSignedUrls(company);
  }

  async update(id: string, updateCompanyDto: Partial<CreateCompanyDto>): Promise<CompanyResponseDto> {
    await this.companyRepository.update(id, updateCompanyDto);
    const updatedCompany = await this.findOne(id);
    return updatedCompany;
  }

  async remove(id: string): Promise<void> {
    await this.companyRepository.delete(id);
  }

  /**
   * Crea un CompanyResponseDto con URLs firmadas para los documentos
   */
  private async createCompanyResponseWithSignedUrls(company: Company): Promise<CompanyResponseDto> {
    const companyDto = new CompanyResponseDto(company);
    
    // Generar URLs firmadas para todos los documentos en paralelo
    const [chamberSignedUrl, rutSignedUrl, legalIdSignedUrl] = await Promise.all([
      this.generateSignedUrlSafely(company.chamberOfCommerceUrl),
      this.generateSignedUrlSafely(company.rutUrl),
      this.generateSignedUrlSafely(company.legalRepresentativeIdUrl),
    ]);
    
    companyDto.chamberOfCommerceSignedUrl = chamberSignedUrl;
    companyDto.rutSignedUrl = rutSignedUrl;
    companyDto.legalRepresentativeIdSignedUrl = legalIdSignedUrl;
    
    return companyDto;
  }

  /**
   * Genera una URL firmada de forma segura, manejando errores
   */
  private async generateSignedUrlSafely(fileKey?: string): Promise<string | undefined> {
    if (!fileKey) {
      return undefined;
    }
    
    try {
      // URLs válidas por 24 horas para documentos
      return await this.fileUploadService.getSignedUrl(fileKey, 86400);
    } catch (error) {
      console.error(`Error generating signed URL for document ${fileKey}:`, error);
      return undefined;
    }
  }
}
