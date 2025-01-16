import { Injectable } from '@nestjs/common';
import { JsonRpcProvider, Contract, JsonRpcSigner, formatUnits, parseUnits } from 'ethers';
import { createClient } from 'redis';

@Injectable()
export class AmigoService {
  private provider: JsonRpcProvider;
  private contract: Contract;
  private contractAddress: string = '0xdc64a140aa3e981100a9beca4e685f962f0cf6c9';
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

    const contractWithSigner = this.contract.connect(signer);
    const tx = await contractWithSigner['transfer'](to, parseUnits(amount, 18));
    await tx.wait();

    await this.redisClient.sAdd(`${from}send`, to);
    await this.redisClient.sAdd(`${to}recieve`, from);

    console.log(`Added ${to} to ${from}'s send list`);
    console.log(`Added ${from} to ${to}'s recieve list`);
  }

  async getSendList(address: string): Promise<string[]> {
    const sendList = await this.redisClient.sMembers(`${address}send`);
    console.log(`${address}'s send list:`, sendList);
    return sendList;
  }

  async getRecieveList(address: string): Promise<string[]> {
    const recieveList = await this.redisClient.sMembers(`${address}recieve`);
    console.log(`${address}'s recieve list:`, recieveList);
    return recieveList;
  }

  async removeFromSendList(from: string, to: string): Promise<void> {
    const result = await this.redisClient.sRem(`${from}send`, to);
    if (result) {
      console.log(`Removed ${to} from ${from}'s send list`);
    } else {
      console.log(`${to} not found in ${from}'s send list`);
    }
  }

  async removeFromRecieveList(from: string, to: string): Promise<void> {
    const result = await this.redisClient.sRem(`${to}recieve`, from);
    if (result) {
      console.log(`Removed ${from} from ${to}'s recieve list`);
    } else {
      console.log(`${from} not found in ${to}'s recieve list`);
    }
  }
}
