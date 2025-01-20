import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';

type File = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
};

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 1) 이미지 업로드 (Pinata에 업로드 후 CID 반환)
  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: File) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    const cid = await this.userService.uploadImageToIPFS(file);
    return { cid };
  }

  // 2) MetaTx 회원가입
  @Post('register-with-sig')
  async registerWithSig(
    @Body()
    body: {
      user: string;
      username: string;
      phone: string;
      about: string;
      cid: string;
      signature: string;
    },
  ) {
    const { user, username, phone, about, cid, signature } = body;

    const txHash = await this.userService.registerWithSig(
      user,
      username,
      phone,
      about,
      cid,
      signature,
    );

    return {
      success: true,
      txHash,
    };
  }

  // 3) 특정 유저 정보 조회 (컨트랙트에서 데이터 읽어오기)
  @Get(':address')
  async getUser(@Param('address') address: string) {
    const userData = await this.userService.getUserFromContract(address);
    return userData; 
  }
}
