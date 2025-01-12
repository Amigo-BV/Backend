import { Controller, Post, UploadedFile, UseInterceptors, Body } from '@nestjs/common';
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

  @Post('register')
  @UseInterceptors(FileInterceptor('file'))
  async registerUser(
    @UploadedFile() file: File,
    @Body() body: { username: string },
  ) {
    const { username } = body;

    if (!file) {
      throw new Error('Image file is required.');
    }

    const profileImageCID = await this.userService.uploadImageToIPFS(file);
    const receipt = await this.userService.registerUser(username, profileImageCID);

    return {
      message: 'User registered successfully',
      cid: profileImageCID,
      txHash: receipt.transactionHash,
    };
  }
}
