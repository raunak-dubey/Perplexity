import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { AiModule } from './ai/ai.module';
import { DatabaseModule } from './database/database.module';
import { ChatsModule } from './chats/chats.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),

    DatabaseModule,

    // Feature Module
    AuthModule,
    UserModule,
    AiModule,
    ChatsModule,
  ],
})
export class AppModule {}
