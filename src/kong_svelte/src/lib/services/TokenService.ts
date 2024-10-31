import type { Token } from '$lib/types/backend';
import { getActor } from '$lib/stores/walletStore';
import { UserService } from './UserService';
import { canisterId as kongFaucetId } from '../../../../declarations/kong_faucet';
import { Principal } from '@dfinity/principal';
import { hexStringToUint8Array } from '@dfinity/utils';
import { walletValidator } from '$lib/validators/walletValidator';
import { canisterId as kongBackendCanisterId } from '../../../../declarations/kong_backend';
export class TokenService {
  protected static instance: TokenService;

  public static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  public static async getTokens(): Promise<Token[]> {
    try {
      const actor = await getActor();
      const result = await actor.tokens(['all']);
      
      if (result.Ok) {
        return result.Ok.filter(token => 'IC' in token).map(token => {
          return {
            fee: token.IC.fee,
            decimals: token.IC.decimals,
            token: token.IC.token,
            tokenId: token.IC.token_id,
            chain: token.IC.chain,
            name: token.IC.name,
            canisterId: token.IC.canister_id,
            icrc1: token.IC.icrc1,
            icrc2: token.IC.icrc2,
            icrc3: token.IC.icrc3,
            poolSymbol: token.IC.pool_symbol,
            symbol: token.IC.symbol,
            onKong: token.IC.on_kong
          };
        });
      }
      return [];
    } catch (error) {
      console.error('Error getting tokens:', error);
      throw error;
    }
  }

  public static async getTokenPrices(): Promise<Record<string, number>> {
    try {
      return {
        "ICP": 1,
        "ckBTC": 1,
        "ckETH": 1,
        "ckUSDC": 1,
        "ckUSDT": 1,
      };
    } catch (error) {
      console.error('Error getting token prices:', error);
      throw error;
    }
  }

  public static async getIcrc1TokenMetadata(canisterId: string): Promise<any> {
    try {
      const actor = await getActor(canisterId, 'icrc1');
      return await actor.icrc1_metadata();
    } catch (error) {
      console.error('Error getting icrc1 token metadata:', error);
      throw error;
    }
  }

  public static async getIcrcLogFromMetadata(canisterId: any): Promise<any> {
    try {
      const actor = await getActor(canisterId, 'icrc1');
      const res = await actor.icrc1_metadata();
      const filtered = res.filter((arr: any[]) => {
        if (arr[0] === 'icrc1:logo' || arr[0] === 'icrc1_logo') {
          return arr[1];
        }
      });
      if (filtered.length > 0) {
        return filtered[0][1].Text;
      }
      return null;
    } catch (error) {
      console.error('Error getting icrc1 token metadata:', error);
    }
  }
  public static async getTokenBalances(): Promise<Record<string, number>> {
    await walletValidator.requireWalletConnection();
    try {
      const actor = await getActor();
      const tokensResult = await actor.tokens(['all']);
      
      if (!tokensResult.Ok) {
        return {};
      }

      const walletCall = await UserService.getWhoami()
      const wallet = walletCall.Ok;
      const balances: Record<string, number> = {};
      
      for (const token of tokensResult.Ok) {
        if (!('IC' in token)) continue;
        
        try {
          const actor = await getActor(token.IC.canister_id, 'icrc1');
          const balance = await actor.icrc1_balance_of({
            owner: Principal.fromText(kongBackendCanisterId),
            subaccount: [hexStringToUint8Array(wallet.account_id)]
          });
          console.log("balance", balance);
          balances[token.IC.canister_id] = balance;
        } catch (err) {
          console.log(`Error getting balance for ${token.IC.canister_id}:`, err);
          balances[token.IC.canister_id] = 0;
        }
      }

      return balances;
    } catch (error) {
      console.error('Error getting token balances:', error);
      throw error;
    }
  }

  public static async claimFaucetTokens(): Promise<void> {
    try {
      const actor = await getActor(kongFaucetId, 'kong_faucet');
      await actor.claim();
      console.log('Faucet tokens claimed');
    } catch (error) {
      console.error('Error claiming faucet tokens:', error);
      throw error;
    }
  }
} 