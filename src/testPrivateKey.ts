import * as dotenv from 'dotenv';
import Web3 from 'web3';

dotenv.config();

const privateKey = '0x' + process.env.PRIVATE_KEY;  // "0x" 접두사 추가
console.log(`Loaded PRIVATE_KEY (length: ${privateKey.length}): "${privateKey}"`);

const web3 = new Web3();

try {
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  console.log('Account Address:', account.address);  // 계정 주소 출력
} catch (error) {
  console.error('Error:', error.message);
}
