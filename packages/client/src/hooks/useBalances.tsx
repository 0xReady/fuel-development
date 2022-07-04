import { Wallet } from 'fuels';
import { useWallet } from '../store/useStore';
import { Queries } from '../utils/constants';
import { useQuery, UseQueryOptions } from 'react-query';

export default function useBalances(opts: UseQueryOptions = {}) {
  const wallet = useWallet();

  return useQuery(
    Queries.UserQueryBalances,
    async () => wallet?.getBalances(),
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(opts as any),
      onSuccess(data) {
        opts.onSuccess?.(data);
        console.log('this queried balances');
      },
    },
  );
}
