export const FUEL_PROVIDER_URL = 'http://127.0.0.1:4000/graphql';

export const FUEL_FAUCET_URL = 'http://127.0.0.1:4040/dispense';

export const ESCROW_CONTRACT_ID =
  '0x2131f2700f670c75e0e79a7d388a4811ddfd706c6266d9ca1a40060bdf8b30c6';

export const FIRST_ASSET_CONTRACT_ID =
  '0x2e426d9fa134cb6e3e4859de689b065cce5ab459bdff1a2bedfa2f6d66d9504f';

export const SECOND_ASSET_CONTRACT_ID =
  '0x531a05bc7c969fd9ebb506e83c8b6b55c74c3195eed7c4440ba82be7d54b0961';

export enum Queries {
  UserQueryBalances = 'UserQueryBalances',
  FaucetQuery = 'FaucetQuery',
}
