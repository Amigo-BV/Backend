import { Injectable } from '@nestjs/common';
import { JsonRpcProvider, Contract, JsonRpcSigner, formatUnits, parseUnits } from 'ethers';

@Injectable()
export class AmigoService {
  private provider: JsonRpcProvider;
  private contract: Contract;
  private contractAddress: string = '0xdc64a140aa3e981100a9beca4e685f962f0cf6c9';

  constructor() {
    // 로컬 네트워크 연결
    this.provider = new JsonRpcProvider('http://localhost:8545');
    
    const abi = [
      "function balanceOf(address account) public view returns (uint256)",
      "function transfer(address recipient, uint256 amount) public returns (bool)",
    ];
    
    this.contract = new Contract(this.contractAddress, abi, this.provider);
  }

  async getBalance(address: string): Promise<string> {
    const balance = await this.contract.balanceOf(address);
    return formatUnits(balance, 18);
  }

  async transferTokens(to: string, amount: string): Promise<void> {
  try {
    const signer: JsonRpcSigner = await this.provider.getSigner();
    const contractWithSigner = this.contract.connect(signer);

    // 전송 시도
    const tx = await contractWithSigner['transfer'](to, parseUnits(amount, 18));
    await tx.wait();

    console.log(`Tokens transferred successfully to ${to}`);
  } catch (error) {
    console.error("Error during token transfer:", error);
    throw error; // 클라이언트로 에러 반환
  }
}
}
