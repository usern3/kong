declare global {
  namespace BE {
    interface PoolResponse {
      pools: Pool[];
      total_tvl: bigint;
      total_24h_volume: bigint;
      total_24h_lp_fee: bigint;
    }
  
    interface Pool {
      id: string;
      lp_token_symbol: string;
      balance: bigint;
      total_lp_fee: bigint;
      name: string;
      lp_fee_0: bigint;
      lp_fee_1: bigint;
      balance_0: bigint;
      balance_1: bigint;
      rolling_24h_volume: bigint;
      rolling_24h_apy: number;
      address_0: string;
      address_1: string;
      symbol_0: string;
      symbol_1: string;
      total_volume: bigint;
      pool_id: number;
      price: number;
      chain_0: string;
      chain_1: string;
      lp_token_supply: bigint;
      symbol: string;
      lp_fee_bps: number;
      on_kong: boolean;
    }
  }
}

export {};
