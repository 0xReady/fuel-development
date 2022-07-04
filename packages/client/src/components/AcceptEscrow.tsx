import clsx from 'clsx';
import { useState } from 'React';
import { acceptEscrow } from '../utils/contractActions';
import { useWallet, addCreatedEscrow } from '../store/useStore';
import Button from './Button';
import useBalances from '../hooks/useBalances';

export default function InitEscrow() {
  const wallet = useWallet();
  const balances = useBalances();
  const [escrowID, setEscrowID] = useState<string>('');
  const [amountWillSend, setAmountWillSend] = useState<number>(0);
  const [amountRequested, setAmountRequested] = useState<number>(0);

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
        <p className="text-neutral-100">Accept escrow</p>
        <input
          className={clsx(
            'w-full p-2 rounded-lg',
            'bg-neutral-800 text-neutral-200',
          )}
          placeholder="Escrow ID"
          value={escrowID}
          onChange={evt => setEscrowID(evt.target.value)}
        />
        <p>I will send Token B</p>

        <input
          className={clsx(
            'w-full p-2 rounded-lg',
            'bg-neutral-800 text-neutral-200',
          )}
          placeholder="Amount to send"
          type="number"
          value={amountWillSend}
          onChange={evt => setAmountWillSend(Number.parseInt(evt.target.value))}
        />
        <Button
          disabled={escrowID === ''}
          onClick={async () => {
            const id = await acceptEscrow(wallet, escrowID, amountWillSend);
            await balances.refetch();
          }}
        >
          Accept escrow
        </Button>
      </div>
    </>
  );
}
