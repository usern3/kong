import type { User } from '$lib/types/backend';
import type { Principal } from '@dfinity/principal';
import { getActor, walletStore } from '$lib/stores/walletStore';
import { walletValidator } from '$lib/validators/walletValidator';
import { get } from 'svelte/store';

export class UserService {
  protected static instance: UserService;

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }


  private static isConnected(): boolean {
    const wallet = get(walletStore);
    return wallet.isConnected;
  }


  public static async getWhoami(): Promise<User> {
    await walletValidator.requireWalletConnection();
    try {
      const actor = await getActor();
      return await actor.get_user();
    } catch (error) {
      console.error('Error calling get_user method:', error);
      throw error;
    }
  }

  public static async getUserBalances(): Promise<Record<string, any>> {
    await walletValidator.requireWalletConnection();
    try {
      const actor = await getActor();
      const result = await actor.user_balances([]);
      console.log("user_balances result", result);
      if (result.Ok) {
        const balances: Record<string, any> = {};
        result.Ok.forEach((lpToken) => {
          if ('LP' in lpToken) {
            const lp = lpToken.LP;
            balances[lp.symbol] = {
              balance: lp.balance,
              usdBalance: lp.usd_balance,
              token0Amount: lp.amount_0,
              token1Amount: lp.amount_1,
              token0Symbol: lp.symbol_0,
              token1Symbol: lp.symbol_1,
              token0UsdAmount: lp.usd_amount_0,
              token1UsdAmount: lp.usd_amount_1,
              timestamp: lp.ts
            };
          }
        });
        return balances;
      }
      return {};
    } catch (error) {
      console.error('Error getting user balances:', error);
      throw error;
    }
  }
} 