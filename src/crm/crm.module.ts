import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Funnel } from './entities/funnel.entity';
import { Stage } from './entities/stage.entity';
import { Lead } from './entities/lead.entity';
import { FunnelsService } from './services/funnels.service';
import { LeadsService } from './services/leads.service';
import { FunnelsController } from './controllers/funnels.controller';
import { LeadsController } from './controllers/leads.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Funnel, Stage, Lead])
  ],
  controllers: [FunnelsController, LeadsController],
  providers: [FunnelsService, LeadsService],
  exports: [FunnelsService, LeadsService]
})
export class CrmModule {}
