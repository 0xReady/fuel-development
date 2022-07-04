import clsx from 'clsx';
import { useState } from 'React';
import { revertEscrow } from '../utils/contractActions';
import { useWallet } from '../store/useStore';
import Button from './Button';
import useBalances from '../hooks/useBalances';

export default function InitEscrow() {
  const wallet = useWallet();
  const balances = useBalances();
  const [escrowID, setEscrowID] = useState<string>('');

  return (
    <>
      <div
        className={clsx(
          'my-24 border-white rounded-2xl',
          'bg-neutral-900 text-white',
          'flex flex-col space-y-4',
          'w-[800px] p-4',
        )}
      >
        <p className="text-neutral-100">Revert escrow</p>
        <input
          className={clsx(
            'w-full p-2 rounded-lg',
            'bg-neutral-800 text-neutral-200',
          )}
          placeholder="Escrow ID"
          value={escrowID}
          onChange={evt => setEscrowID(evt.target.value)}
        />
        <Button
          disabled={escrowID === ''}
          onClick={async () => {
            const id = await revertEscrow(wallet, escrowID);
            await balances.refetch();
          }}
        >
          Revert escrow
        </Button>
      </div>
    </>
  );
}
