import clsx from 'clsx';
import { ZeroBytes32 } from 'fuels';
import useFaucet from './hooks/useFaucet';
import useStore, { useWallet } from './store/useStore';
import useBalances from './hooks/useBalances';
import Button from './components/Button';
import { createAsset } from './utils/contractActions';
import {
  FIRST_ASSET_CONTRACT_ID,
  SECOND_ASSET_CONTRACT_ID,
} from './utils/constants';
import InitEscrow from './components/InitEscrow';
import AcceptEscrow from './components/AcceptEscrow';
import RevertEscrow from './components/RevertEscrow';

const assetIdMap: Record<string, string> = {
  [FIRST_ASSET_CONTRACT_ID]: 'Token A',
  [SECOND_ASSET_CONTRACT_ID]: 'Token B',
  [ZeroBytes32]: 'ETH',
};

function App() {
  const wallet = useWallet();
  const faucet = useFaucet();
  const balances = useBalances();
  const createdEscrows = useStore(store => store.createdEscrows);

  console.log('balances', balances.data);
  return (
    <div
      className={clsx(
        'w-full min-h-screen bg-green-900',
        'flex flex-col items-center',
      )}
    >
      <div
        className={clsx(
          'mt-24 border-white rounded-2xl',
          'bg-neutral-900 text-white',
          'w-[800px] p-4',
        )}
      >
        <p className="">Your wallet (confined to this page session)</p>
        <div className="py-12 text-neutral-300">
          <p className={clsx('text-neutral-100')}>Address</p>
          <p className={clsx('text-neutral-500')}>
            {wallet.address.toString()}
          </p>
          <p className={clsx('text-neutral-100')}>Private key</p>
          <p className={clsx('text-neutral-500')}>
            {wallet.privateKey.toString()}
          </p>
          <p>Balances</p>
          <div className="flex flex-col pt-4 space-y-4">
            {balances.data?.map(coin => (
              <div key={coin.assetId}>
                <p className={clsx('text-neutral-100')}>Asset Id</p>
                <p className={clsx('text-neutral-500')}>
                  {assetIdMap[coin.assetId.toString()]}
                </p>
                <p className={clsx('text-neutral-100')}>Amount</p>
                <p className={clsx('text-neutral-500')}>
                  {coin.amount.toString()}
                </p>
              </div>
            ))}
          </div>
        </div>
        {createdEscrows.length > 0 && (
          <div className="py-4">
            <p className={clsx('text-neutral-100')}>Created escrow IDs</p>
            {createdEscrows.map(id => (
              <p key={id.toString()} className="text-neutral-500">
                {id.toString()}
              </p>
            ))}
          </div>
        )}
        <div className={clsx('flex-col space-y-4')}>
          <Button
            onClick={async () => {
              faucet.handleFaucet();
            }}
          >
            Use Eth Faucet
          </Button>
          <Button
            onClick={async () => {
              await createAsset(wallet, FIRST_ASSET_CONTRACT_ID);
              await balances.refetch();
            }}
            disabled={balances.data?.length === 0}
          >
            Get some Token A
          </Button>
          <Button
            onClick={async () => {
              await createAsset(wallet, SECOND_ASSET_CONTRACT_ID);
              await balances.refetch();
            }}
            disabled={balances.data?.length === 0}
          >
            Get some Token B
          </Button>
        </div>
      </div>
      <InitEscrow />
      <AcceptEscrow />
      <RevertEscrow />
    </div>
  );
}

export default App;
