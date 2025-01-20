import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Web3 from 'web3';
import axios from 'axios';
import FormData from 'form-data';
import * as contractABI from '../abi/UserContractMeta.json';

type File = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
};

@Injectable()
export class UserService {
  private web3: Web3;
  private contract: any;
  private adminAccount: any;

  constructor(private configService: ConfigService) {
    const rpcUrl = this.configService.get<string>('API_URL');
    let privateKey = this.configService.get<string>('PRIVATE_KEY');
    const contractAddress = this.configService.get<string>('USER_CONTRACT');

    // Web3 인스턴스 생성
    this.web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

    // Private key 0x prefix 확인
    if (!privateKey.startsWith('0x')) {
      privateKey = '0x' + privateKey;
    }

    // Admin account 추가
    this.adminAccount = this.web3.eth.accounts.privateKeyToAccount(privateKey);
    this.web3.eth.accounts.wallet.add(this.adminAccount);

    // 컨트랙트 인스턴스 생성
    this.contract = new this.web3.eth.Contract(
      contractABI.abi, 
      contractAddress,
    );
  }

  // Pinata에 이미지 업로드
  async uploadImageToIPFS(file: File): Promise<string> {
    const apiKey = this.configService.get<string>('PINATA_API_KEY');
    const secretKey = this.configService.get<string>('PINATA_SECRET_API_KEY');

    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          pinata_api_key: apiKey,
          pinata_secret_api_key: secretKey,
        },
      },
    );

    return response.data.IpfsHash;
  }

  // 메타트랜잭션: registerWithSig 호출
  async registerWithSig(
    user: string,
    username: string,
    phone: string,
    about: string,
    cid: string,
    signature: string,
  ): Promise<string> {
    console.log('registerWithSig params =>', {
      user,
      username,
      phone,
      about,
      cid,
      signature,
    });

    const tx = this.contract.methods.registerWithSig(
      user,
      username,
      phone,
      about,
      cid,
      signature,
    );

    // 가스 추정
    const gas = await tx.estimateGas({
      from: this.adminAccount.address,
    });
    const gasPrice = await this.web3.eth.getGasPrice();

    // 사인 후 트랜잭션 전송 (admin 지갑에서 가스비 지불)
    const signed = await this.adminAccount.signTransaction({
      from: this.adminAccount.address,
      to: this.contract.options.address,
      data: tx.encodeABI(),
      gas,
      gasPrice,
    });

    const receipt = await this.web3.eth.sendSignedTransaction(
      signed.rawTransaction,
    );

    return receipt.transactionHash as unknown as string;
  }

  // 컨트랙트에서 유저 정보 조회
  async getUserFromContract(userAddress: string) {
    try {
      // 컨트랙트 메서드 호출 (읽기 전용)
      const userData = await this.contract.methods.getUser(userAddress).call();

      // 반환된 데이터 변환
      return {
        userAddress: userData.userAddress,
        username: userData.username,
        phone: userData.phone,
        about: userData.about,
        profileImageCID: userData.profileImageCID,
      };
    } catch (err) {
      throw new Error('User not found or error reading user data');
    }
  }
}
