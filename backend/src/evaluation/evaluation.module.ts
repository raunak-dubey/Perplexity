import { Module } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { Idea, IdeaSchema } from 'src/idea/schemas/idea.schema';
import { Evaluation, EvaluationSchema } from './schemas/evaluation.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { EvaluationController } from './evaluation.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Evaluation.name, schema: EvaluationSchema },
      { name: Idea.name, schema: IdeaSchema },
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
  ],
  controllers: [EvaluationController],
  providers: [EvaluationService],
  exports: [EvaluationService],
})
export class EvaluationModule {}
