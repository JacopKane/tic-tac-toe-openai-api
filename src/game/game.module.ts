import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GameService } from './game.service';
import { OpenAI } from 'openai';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [
    GameService,
    {
      provide: 'OpenAI',
      useFactory: () => {
        return new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
      },
    },
  ],
  exports: [GameService],
})
export class GameModule {}
