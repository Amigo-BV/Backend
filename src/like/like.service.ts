import { Injectable } from '@nestjs/common';
import { JsonRpcProvider, Contract, JsonRpcSigner, formatUnits, parseUnits } from 'ethers';
import { createClient } from 'redis';

@Injectable()
export class LikeService {
  private provider: JsonRpcProvider;
  private contract: Contract;
  private contractAddress: string = '0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1';
  private redisClient;

  constructor() {
    this.provider = new JsonRpcProvider('http://localhost:8545');

    const abi = [
      "function balanceOf(address account) public view returns (uint256)",
      "function transfer(address recipient, uint256 amount) public returns (bool)",
    ];

    this.contract = new Contract(this.contractAddress, abi, this.provider);

    this.redisClient = createClient({ url: 'redis://localhost:6379' });
    this.redisClient.connect();
  }

  async getBalance(address: string): Promise<string> {
    const balance = await this.contract.balanceOf(address);
    return formatUnits(balance, 18);
  }

  async sendLike(to: string, amount: string): Promise<void> {
    const signer: JsonRpcSigner = await this.provider.getSigner();
    const from = await signer.getAddress();

    // 주소를 소문자로 통일
    const fromLc = from.toLowerCase();
    const toLc = to.toLowerCase();

    const contractWithSigner = this.contract.connect(signer);
    const tx = await contractWithSigner.transfer(toLc, parseUnits(amount, 18));
    await tx.wait();

    // 모든 Redis 키에 소문자 주소 사용
    await this.redisClient.sAdd(`${fromLc}send`, toLc);
    await this.redisClient.sAdd(`${toLc}recieve`, fromLc);

    console.log(`Added ${toLc} to ${fromLc}'s send list`);
    console.log(`Added ${fromLc} to ${toLc}'s recieve list`);

    // 매칭 여부 확인 시에도 소문자 주소 사용
    const isMatched = await this.redisClient.sIsMember(`${toLc}send`, fromLc);
    if (isMatched) {
      await this.redisClient.sAdd(`${fromLc}matches`, toLc);
      await this.redisClient.sAdd(`${toLc}matches`, fromLc);

      console.log(`Match formed between ${fromLc} and ${toLc}`);
    }
  }

  async getSendList(address: string): Promise<string[]> {
    const key = `${address.toLowerCase()}send`;
    const sendList = await this.redisClient.sMembers(key);
    console.log(`${address}'s send list:`, sendList);
    return sendList;
  }

  async getRecieveList(address: string): Promise<string[]> {
    const key = `${address.toLowerCase()}recieve`;
    const recieveList = await this.redisClient.sMembers(key);
    console.log(`${address}'s recieve list:`, recieveList);
    return recieveList;
  }

  async getMatches(address: string): Promise<string[]> {
    const key = `${address.toLowerCase()}matches`;
    const matches = await this.redisClient.sMembers(key);
    console.log(`${address}'s matches: `, matches);
    return matches;
  }

  async removeFromSendList(from: string, to: string): Promise<void> {
    const key = `${from.toLowerCase()}send`;
    const result = await this.redisClient.sRem(key, to.toLowerCase());
    if (result) {
      console.log(`Removed ${to} from ${from}'s send list`);
    } else {
      console.log(`${to} not found in ${from}'s send list`);
    }
  }

  async removeFromRecieveList(from: string, to: string): Promise<void> {
    const key = `${to.toLowerCase()}recieve`;
    const result = await this.redisClient.sRem(key, from.toLowerCase());
    if (result) {
      console.log(`Removed ${from} from ${to}'s recieve list`);
    } else {
      console.log(`${from} not found in ${to}'s recieve list`);
    }
  }
}
