import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LikeModule } from './like/like.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // 환경 변수 설정
    UserModule, // UserModule 추가
    LikeModule, // LikeModule 추가
  ],
})
export class AppModule {}
