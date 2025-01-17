import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Web3 } from 'web3';
import * as contractABI from '../abi/UserContract.json';

@Injectable()
export class UserService {
  private web3: Web3;
  private contract: any;

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {
    const rpcUrl = this.configService.get<string>('API_URL');
    const contractAddress = this.configService.get<string>('USER_CONTRACT');

    this.web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
    this.contract = new this.web3.eth.Contract(contractABI.abi, contractAddress);
  }

  /**
   * 서명 검증
   */
  verifySignature(message: string, signature: string): string {
    try {
      return this.web3.eth.accounts.recover(message, signature);
    } catch (error) {
      throw new UnauthorizedException('Invalid signature');
    }
  }
  generateJwtToken(address: string): string {
    return this.jwtService.sign({ address });
  }
  /**
   * 회원가입
   */
  async registerUser(username: string, signerAddress: string): Promise<any> {
    const tx = this.contract.methods.register(username,"0x123456789");
    const gas = await tx.estimateGas({ from: signerAddress });

    return tx.send({ from: signerAddress, gas });
  }

}
