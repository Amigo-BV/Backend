import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Web3 } from 'web3';
import * as contractABI from '../abi/AmigoContract.json';
import { createClient } from 'redis';

@Injectable()
export class LikeService {
  private web3: Web3;
  private contract: any;
  private redisClient;

  constructor(private readonly configService: ConfigService) {
    // 환경 변수로부터 RPC URL 및 컨트랙트 주소를 가져옵니다.
    const rpcUrl = this.configService.get<string>('API_URL');
    const contractAddress = this.configService.get<string>('AMIGO_CONTRACT');

    // Web3 및 컨트랙트 초기화
    this.web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
    this.contract = new this.web3.eth.Contract(contractABI.abi, contractAddress);

    // Redis 초기화
    this.redisClient = createClient({ url: 'redis://localhost:6379' });
    this.redisClient.connect();
  }

  /**
   * 서명 검증
   */
  verifySignature(message: string, signature: string): string {
    try {
      return this.web3.eth.accounts.recover(message, signature);
    } catch (error) {
      throw new Error('Invalid signature');
    }
  }

  /**
   * 잔액 조회
   */
  async getBalance(address: string): Promise<string> {
    const balance = await this.contract.methods.balanceOf(address).call();
    return this.web3.utils.fromWei(balance, 'ether');
  }

  /**
   * 좋아요 전송
   */
  async sendLike(signerAddress: string, to: string, amount: string): Promise<void> {
    const tx = this.contract.methods.transfer(to, this.web3.utils.toWei(amount, 'ether'));
    const gas = await tx.estimateGas({ from: signerAddress });

    const receipt = await tx.send({ from: signerAddress, gas });
    console.log('Transaction successful:', receipt.transactionHash);

    await this.redisClient.sAdd(`${signerAddress}send`, to);
    await this.redisClient.sAdd(`${to}recieve`, signerAddress);
  }

  /**
   * 좋아요 보낸 리스트 조회
   */
  async getSendList(address: string): Promise<string[]> {
    return await this.redisClient.sMembers(`${address}send`);
  }

  /**
   * 좋아요 받은 리스트 조회
   */
  async getReceiveList(address: string): Promise<string[]> {
    return await this.redisClient.sMembers(`${address}recieve`);
  }

  /**
   * 좋아요 보낸 리스트에서 특정 항목 제거
   */
  async removeFromSendList(from: string, to: string): Promise<void> {
    await this.redisClient.sRem(`${from}send`, to);
  }

  /**
   * 좋아요 받은 리스트에서 특정 항목 제거
   */
  async removeFromReceiveList(from: string, to: string): Promise<void> {
    await this.redisClient.sRem(`${to}recieve`, from);
  }
}
