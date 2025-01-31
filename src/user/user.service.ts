import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Web3 } from 'web3';
import * as contractABI from '../abi/UserContract.json';
import axios from 'axios';
import FormData from 'form-data';

type File = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
};

@Injectable()
export class UserService {
  private web3: Web3;
  private contract: any;
  private account: any;

  constructor(private configService: ConfigService) {
    const rpcUrl = this.configService.get<string>('API_URL');
    let privateKey = this.configService.get<string>('PRIVATE_KEY');
    const contractAddress = this.configService.get<string>('USER_CONTRACT');

    console.log('Loaded PRIVATE_KEY:', privateKey);
  console.log('Loaded CONTRACT_ADDRESS:', contractAddress);

    if (!privateKey.startsWith('0x')) {
      privateKey = '0x' + privateKey;
    }

    this.web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
    this.account = this.web3.eth.accounts.privateKeyToAccount(privateKey);

    if (!this.account) {
        throw new Error('Failed to create account with the provided private key.');
      }
    
    this.web3.eth.accounts.wallet.add(this.account);
    console.log('Account Address:', this.account.address);
    this.contract = new this.web3.eth.Contract(contractABI.abi, contractAddress);
  }

  async uploadImageToIPFS(file: File): Promise<string> {
    const apiKey = this.configService.get<string>('PINATA_API_KEY');
    const secretKey = this.configService.get<string>('PINATA_SECRET_API_KEY');

    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      headers: {
        ...formData.getHeaders(),
        pinata_api_key: apiKey,
        pinata_secret_api_key: secretKey,
      },
    });

    return response.data.IpfsHash;  // CID 반환
  }

  async registerUser(username: string, profileImageCID: string): Promise<any> {
    const tx = this.contract.methods.register(username, profileImageCID);
  
    let gas;
    try {
      gas = await tx.estimateGas({ from: this.account.address });
    } catch (error) {
      console.error('Gas estimation failed:', error.message);
      gas = 10000;  // 기본 가스 값 설정
    }
  
    console.log(`Estimated Gas: ${gas}`);
  
    const signedTx = await this.account.signTransaction({
      from: this.account.address,
      to: this.contract.options.address,
      data: tx.encodeABI(),
      gas,  // 가스 값 추가
      gasPrice: this.web3.utils.toWei('10', 'gwei'),  // 기본 가스 가격 설정
    });
  
    const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    console.log('Transaction Receipt:', receipt);
    return receipt;
  }

  
}
