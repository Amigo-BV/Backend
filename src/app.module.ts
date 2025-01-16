import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AmigoService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true}),
    UserModule,
  ],
  controllers: [AppController],
  providers: [AmigoService],
})
export class AppModule {}
