import { Controller, Post, Body, UploadedFile, UseInterceptors, UnauthorizedException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';

type File = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
};

@Controller('users')
@UseInterceptors(FileInterceptor('file'))
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 회원가입
   */
  @Post('register')
  @UseInterceptors(FileInterceptor('file'))
  async registerUser(
    @UploadedFile() file: File,
    @Body() body: { username: string; address: string; signature: string },
  ) {
    const { username, address, signature } = body;
  
    // 서명 검증
    const message = `Register: ${address}`;
    const signerAddress = this.userService.verifySignature(message, signature);
    console.log(signerAddress);
    console.log(address);
  
    if (signerAddress !== address) {
      throw new UnauthorizedException('Signature does not match the provided address');
    }
    // const profileImageCID = await this.userService.uploadImageToIPFS(file);
    const profileImageCID = "0x123456789";
    
    // 스마트 컨트랙트 호출
    const receipt = await this.userService.registerUser(username, signerAddress, profileImageCID);
  
    return {
      message: 'User registered successfully',
      txHash: receipt.transactionHash,
    };
  }
  

  /**
   * 로그인
   */
  @Post('login')
  async loginUser(
    @Body() body: { address: string; signature: string },
  ) {
    const { address, signature } = body;
  
    // 서명 검증
    const message = `Login: ${address}`;
    const signerAddress = this.userService.verifySignature(message, signature);
  
    if (signerAddress.toLowerCase() !== address.toLowerCase()) {
      throw new UnauthorizedException('Invalid signature');
    }
  
    // JWT 토큰 생성
    const token = this.userService.generateJwtToken(address);
  
    return {
      message: 'Login successful',
      token,
    };
  }
  
}
