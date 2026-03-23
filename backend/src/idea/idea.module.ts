import { Module } from '@nestjs/common';
import { IdeaService } from './idea.service';
import { IdeaController } from './idea.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Idea, IdeaSchema } from './schemas/idea.schema';
import {
  Evaluation,
  EvaluationSchema,
} from 'src/evaluation/schemas/evaluation.schema';
import { AiModule } from 'src/ai/ai.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Idea.name, schema: IdeaSchema },
      { name: Evaluation.name, schema: EvaluationSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        global: true,
        secret: config.get<string>('jwt.accessSecret'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
    AiModule,
  ],
  controllers: [IdeaController],
  providers: [IdeaService],
  exports: [IdeaService],
})
export class IdeaModule {}
