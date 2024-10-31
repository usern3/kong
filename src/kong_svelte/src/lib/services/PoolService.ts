import type { Pool, PoolResponse } from '$lib/types/backend';
import { getActor } from '$lib/stores/walletStore';

export class PoolService {
  protected static instance: PoolService;

  public static getInstance(): PoolService {
    if (!PoolService.instance) {
      PoolService.instance = new PoolService();
    }
    return PoolService.instance;
  }

  public static async getPools(): Promise<PoolResponse> {
    try {
      const actor = await getActor();
      const result = await actor.pools([]);
      if (result.Ok) {
        return result.Ok;
      }
      return { pools: [], total_tvl: 0, total_24h_volume: 0, total_24h_lp_fee: 0 };
    } catch (error) {
      console.error('Error calling pools method:', error);
      throw error;
    }
  }

  public static async getPoolInfo(poolId: string): Promise<Pool> {
    try {
      const actor = await getActor();
      return await actor.get_by_pool_id(poolId);
    } catch (error) {
      console.error('Error getting pool info:', error);
      throw error;
    }
  }
} 