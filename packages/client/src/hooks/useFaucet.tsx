import fetch from 'cross-fetch';
import { useMemo } from 'react';
import { useMutation, useQuery } from 'react-query';
import { Wallet } from 'fuels';
import { FUEL_FAUCET_URL, Queries } from '../utils/constants';
import { useWallet } from '../store/useStore';
import useBalances from '../hooks/useBalances';
type Maybe<T> = T | null | undefined;

export async function fetchFaucet(input: RequestInit) {
  const res = await fetch(FUEL_FAUCET_URL, {
    ...input,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

  return res.json();
}

type UseFaucetOpts = {
  onSuccess?: () => void;
};

export default function useFaucet() {
  const wallet = useWallet();
  const balances = useBalances();
  const mutation = useMutation(
    async () => {
      const response = await fetchFaucet({
        method: 'POST',
        body: JSON.stringify({
          address: wallet?.address,
          captcha: '',
        }),
      });

      if (response.status !== 'Success') {
        throw new Error(`Invalid faucet response: ${JSON.stringify(response)}`);
      }
    },
    {
      onSuccess: async () => {
        await balances.refetch();
      },
    },
  );

  const query = useQuery(Queries.FaucetQuery, async () => {
    const res = fetchFaucet({ method: 'GET' });
    return res;
  });

  function handleFaucet() {
    return mutation.mutate();
  }

  const faucetAmount = useMemo(() => {
    const amount = query.data?.amount || BigInt(0);
    return amount;
  }, [query.status]);

  return {
    query,
    mutation,
    handleFaucet,
    faucetAmount,
  };
}
