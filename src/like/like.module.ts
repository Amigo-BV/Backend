import { Module } from '@nestjs/common';
import { likeController } from './like.controller';
import { LikeService } from './like.service';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true}),
    UserModule,
  ],
  controllers: [likeController],
  providers: [LikeService],
})
export class AppModule {}
