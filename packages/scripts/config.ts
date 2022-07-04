const config = {
  types: {
    artifacts: './packages/contracts/**/out/debug/**.json',
    output: './packages/client/src/types/contracts',
  },
  contracts: [
    {
      name: 'ESCROW_CONTRACT',
      path: './packages/contracts/escrow_contract',
    },
    {
      name: 'ASSET_CONTRACT',
      path: './packages/contracts/asset',
    },
  ],
};

export type Config = {
  env?: {
    [key: string]: string;
  };
  types: {
    artifacts: string;
    output: string;
  };
  contracts: {
    name: string;
    path: string;
  }[];
};

export default config;
