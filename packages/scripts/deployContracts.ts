import 'dotenv/config';
import { readFileSync } from 'fs';
import config, { Config } from './config';
import {
  NativeAssetId,
  Provider,
  TestUtils,
  Wallet,
  CreateTransactionRequest,
  ZeroBytes32,
  ContractUtils,
} from 'fuels';
import path from 'path';

let contractIndex = 0;
export async function getWalletInstance() {
  // Avoid early load of process env
  const { WALLET_SECRET, GENESIS_SECRET, PROVIDER_URL } = process.env;

  if (WALLET_SECRET) {
    console.log('WALLET_SECRET detected');
    return new Wallet(WALLET_SECRET, PROVIDER_URL);
  }
  // If no WALLET_SECRET is informed we assume
  // We are on a test environment
  // In this case it must provide a GENESIS_SECRET
  // on this case the origen of balances should be
  // almost limitless assuming the genesis has enough
  // balances configured
  if (GENESIS_SECRET) {
    console.log('Funding wallet with some coins');
    const provider = new Provider(PROVIDER_URL!);
    return TestUtils.generateTestWallet(provider, [
      [100_000_000, NativeAssetId],
    ]);
  }
  throw new Error('You must provide a WALLET_SECRET or GENESIS_SECRET');
}

function getBinaryName(contractPath: string) {
  const fileName = contractPath.split('/').slice(-1);
  return `/out/debug/${fileName}.bin`;
}

export async function deployContractBinary(wallet: Wallet, binaryPath: string) {
  const { GAS_PRICE, BYTE_PRICE } = process.env;
  if (!wallet) {
    throw new Error('Cannot deploy without wallet');
  }
  const binaryFilePath = path.join(binaryPath, getBinaryName(binaryPath));
  console.log('read binary file from: ', binaryFilePath);
  const bytecode = readFileSync(binaryFilePath);
  // Calculate contractId
  const stateRoot = ZeroBytes32;
  // we compute the salt this way so its the same every time
  const salt = Buffer.from(new Uint8Array(32).fill(contractIndex++));
  const contractId = ContractUtils.getContractId(bytecode, salt, stateRoot);
  console.log('contract id', contractId);
  const request = new CreateTransactionRequest({
    gasPrice: 1,
    bytePrice: 1,
    gasLimit: 1_000_000,
    bytecodeWitnessIndex: 0,
    witnesses: [bytecode],
    salt,
  });
  // Deploy contract using wallet
  console.log('deploy contract');
  request.addContractCreatedOutput(contractId, stateRoot);
  // Add input coins on the wallet to deploy contract
  await wallet.fund(request);
  // Send deploy transaction
  console.log('send [CREATE CONTRACT] transaction to', wallet.provider.url);
  const response = await wallet.sendTransaction(request);
  // Await contract to be fully deployed
  console.log('Waiting contract to be fully deployed');
  await response.wait();
  console.log('contract successful deployed');
  return contractId;
}

export async function deployContracts(config: Config) {
  const wallet = await getWalletInstance();
  const contracts = [];

  for (const { name, path } of config.contracts) {
    if (path.includes('asset')) {
      contracts.push({
        name,
        contractId: await deployContractBinary(wallet, path),
      });
    }
    contracts.push({
      name,
      contractId: await deployContractBinary(wallet, path),
    });
  }

  return contracts;
}

console.log('starting');
deployContracts(config);
