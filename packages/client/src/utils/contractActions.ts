import { Wallet, CoinQuantityLike } from 'fuels';
import {
  ESCROW_CONTRACT_ID,
  FIRST_ASSET_CONTRACT_ID,
  SECOND_ASSET_CONTRACT_ID,
} from './constants';

import { toast } from 'react-toastify';

import {
  AssetAbi__factory,
  EscrowContractAbi__factory,
} from '../types/contracts';

export async function createAsset(wallet: Wallet, contractId: string) {
  const contract = AssetAbi__factory.connect(contractId, wallet);

  const address = {
    value: wallet.address,
  };
  const overrides = {
    gasPrice: BigInt(1),
    bytePrice: BigInt(1),
    variableOutputs: 1,
  };

  try {
    const result = await contract.submit.mint_and_send_to_address(
      100,
      address,
      overrides,
    );
    toast.success('Succesfully minted asset', {
      position: 'bottom-right',
      autoClose: 5000,
    });
  } catch (e) {
    toast.error('Error minting asset', {
      position: 'bottom-right',
      autoClose: 5000,
    });
  }
}

export async function initEscrow(
  wallet: Wallet,
  receiver: string,
  amountSending: number,
  amountRequested: number,
) {
  const contract = EscrowContractAbi__factory.connect(
    ESCROW_CONTRACT_ID,
    wallet,
  );

  const receiverAsAddress = {
    value: receiver,
  };
  const sendingAssetId = {
    value: FIRST_ASSET_CONTRACT_ID,
  };
  const requestedAssetId = {
    value: SECOND_ASSET_CONTRACT_ID,
  };
  const overrides = {
    gasPrice: BigInt(1),
    bytePrice: BigInt(1),
    forward: [amountSending, FIRST_ASSET_CONTRACT_ID] as CoinQuantityLike,
  };

  const result = await contract.submit.create(
    receiverAsAddress,
    requestedAssetId,
    amountRequested,
    overrides,
  );

  return result;
}

export async function acceptEscrow(
  wallet: Wallet,
  escrowID: string,
  amountSending: number,
) {
  const contract = EscrowContractAbi__factory.connect(
    ESCROW_CONTRACT_ID,
    wallet,
  );

  const overrides = {
    gasPrice: BigInt(1),
    bytePrice: BigInt(1),
    forward: [amountSending, SECOND_ASSET_CONTRACT_ID] as CoinQuantityLike,
    variableOutputs: 2,
  };

  try {
    const result = await contract.submit.accept(escrowID, overrides);
    toast.success(`Successfully accepted escrow ${escrowID}`, {
      position: 'bottom-right',
      autoClose: 5000,
    });
  } catch (e) {
    toast.error(`Error accepting escrow ${escrowID}`, {
      position: 'bottom-right',
      autoClose: 5000,
    });
  }
}

export async function revertEscrow(wallet: Wallet, escrowID: string) {
  const contract = EscrowContractAbi__factory.connect(
    ESCROW_CONTRACT_ID,
    wallet,
  );

  const overrides = {
    gasPrice: BigInt(1),
    bytePrice: BigInt(1),
    variableOutputs: 1,
  };

  try {
    const result = await contract.submit.revert(escrowID, overrides);
    toast.success(`Successfully reverted escrow ${escrowID}`, {
      position: 'bottom-right',
      autoClose: 5000,
    });
  } catch (e) {
    toast.error(`Error accepting escrow ${escrowID}`, {
      position: 'bottom-right',
      autoClose: 5000,
    });
  }
}
