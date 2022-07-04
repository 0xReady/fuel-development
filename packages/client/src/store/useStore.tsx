import create, { State } from 'zustand';
import produce from 'immer';
import { Wallet } from 'fuels';
import { FUEL_PROVIDER_URL } from '../utils/constants';

export interface Store extends State {
  set: (fn: (store: Store) => void) => void;
  createdEscrows: Array<bigint>;
  wallet: Wallet;
}

const useStore = create<Store>((set, get) => ({
  set: fn => set(produce(fn)),
  wallet: Wallet.generate({
    provider: FUEL_PROVIDER_URL,
  }),
  createdEscrows: [],
}));

export function useWallet(): Wallet {
  return useStore(store => store.wallet);
}

export function addCreatedEscrow(id: bigint) {
  return useStore.setState(state => {
    state.createdEscrows = [...state.createdEscrows, id];
    return state;
  });
}

export default useStore;
