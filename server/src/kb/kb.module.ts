import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { RagModule } from '../rag/rag.module';
import { KbController } from './kb.controller';
import { KbService } from './kb.service';

@Module({
  imports: [
    PrismaModule,
    RagModule,
    JwtModule.register({}),
  ],
  controllers: [KbController],
  providers: [KbService],
  exports: [KbService],
})
export class KbModule {}
