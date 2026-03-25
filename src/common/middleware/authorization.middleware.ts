import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

@Injectable()
export class AuthorizationMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }

    try {
      const token = authHeader.substring(7);
      const payload = this.jwtService.verify(token);
      
      const user = await this.userRepository.findOne({
        where: { id: payload.sub, isActive: true },
        relations: ['company'],
      });

      if (user) {
        req.user = user;
      }
    } catch (error) {
      // Token inválido, continuar sin usuario
      console.log('Token inválido:', error.message);
    }

    next();
  }
}
