import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LikeService } from './like.service';
import { LikeController } from './like.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [ConfigModule, UserModule], // UserModule을 import
  controllers: [LikeController],
  providers: [LikeService],
})
export class LikeModule {}
