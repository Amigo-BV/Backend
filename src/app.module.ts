import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AmigoService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AmigoService],
})
export class AppModule {}
