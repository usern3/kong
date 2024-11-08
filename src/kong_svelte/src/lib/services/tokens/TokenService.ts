import { getActor, walletStore } from '$lib/services/wallet/walletStore';
import { PoolService } from '../../services/pools/PoolService';
import { formatToNonZeroDecimal, formatTokenAmount } from '$lib/utils/numberFormatUtils';
import { get } from 'svelte/store';
import { ICP_CANISTER_ID } from '$lib/constants/canisterConstants';
import { poolStore } from '$lib/services/pools/poolStore';
import { canisterId as kongBackendCanisterId } from '../../../../../declarations/kong_backend';
import { Principal } from '@dfinity/principal';
import { TokenSchema, BETokenSchema, BETokenArraySchema } from './tokenSchema';
import { IcrcService } from '$lib/services/icrc/IcrcService';

export class TokenService {
  protected static instance: TokenService;
  private static logoCache = new Map<string, string>();
  private static priceCache = new Map<string, { price: number; timestamp: number }>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static readonly DEFAULT_LOGOS = {
    [ICP_CANISTER_ID]: '/tokens/icp.webp',
    DEFAULT: '/tokens/not_verified.webp'
  };

  public static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  public static async fetchTokens(): Promise<BE.Token[]> {
    const actor = await getActor();
    const result = await actor.tokens(['all'])
    return result.Ok
  }

  public static async enrichTokenWithMetadata(
    tokens: FE.Token[]
  ): Promise<FE.Token[]> {
    const enrichedTokens: FE.Token[] = [];
    const poolData = get(poolStore);

    for (const token of tokens) {
      try {
        // Validate the base token
        TokenSchema.parse(token);

        const fee = await this.fetchTokenFee(token);

        const [price, volume24h] = await Promise.all([
          this.getCachedPrice(token),
          this.calculate24hVolume(token, poolData.pools),
        ]);

        const logo = await this.getCachedLogo(token);

        const enrichedToken: FE.Token = {
          ...token,
          fee,
          price,
          total_24h_volume: volume24h,
          logo,
        };

        enrichedTokens.push(enrichedToken);
      } catch (error) {
        console.error(`Error enriching token ${token.symbol}:`, error);

        // Even if enrichment fails, include the token with defaults
        enrichedTokens.push({
          ...token,
          fee: BigInt(10000),
          logo: this.DEFAULT_LOGOS.DEFAULT,
          price: token.price || 0,
          total_24h_volume: token.total_24h_volume || 0n,
        });
      }
    }

    return enrichedTokens;
  }

  private static async getCachedPrice(token: FE.Token): Promise<number> {
    const cached = this.priceCache.get(token.canister_id);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.price;
    }

    const price = await this.fetchPrice(token);
    this.priceCache.set(token.canister_id, {
      price,
      timestamp: Date.now()
    });
    return price;
  }

  private static async getCachedLogo(token: FE.Token): Promise<string> {
    if (this.logoCache.has(token.canister_id)) {
      return this.logoCache.get(token.canister_id);
    }

    if (token.canister_id === ICP_CANISTER_ID) {
      const logo = this.DEFAULT_LOGOS[ICP_CANISTER_ID];
      this.logoCache.set(token.canister_id, logo);
      return logo;
    }

    try {
      const actor = await getActor(token.canister_id, 'icrc1');
      const res = await actor.icrc1_metadata();
      const logoEntry = res.find(
        ([key]) => key === 'icrc1:logo' || key === 'icrc1_logo'
      );

      const logo = logoEntry && logoEntry[1]?.Text 
        ? logoEntry[1].Text 
        : this.DEFAULT_LOGOS.DEFAULT;

      this.logoCache.set(token.canister_id, logo);
      return logo;
    } catch (error) {
      console.error('Error fetching token logo:', error);
      const defaultLogo = this.DEFAULT_LOGOS.DEFAULT;
      this.logoCache.set(token.canister_id, defaultLogo);
      return defaultLogo;
    }
  }

  public static async fetchBalances(
    tokens: FE.Token[],
    principalId: string = null
  ): Promise<Record<string, FE.TokenBalance>> {
    const wallet = get(walletStore);
    if (!wallet.isConnected) return {};

    if (!principalId) {
      principalId = wallet.account.owner.toString();
    }

    const balances: Record<string, FE.TokenBalance> = {};

    for (const token of tokens) {
      try {
        let balance: bigint;

        if (token.icrc1) {
          balance = await IcrcService.getIcrc1Balance(
            token,
            Principal.fromText(principalId)
          );
        } else {
          // Handle other token types if necessary
          balance = BigInt(0); // Default fallback or handle appropriately
        }

        const actualBalance = formatTokenAmount(balance.toString(), token.decimals);
        const price = await this.fetchPrice(token);
        const usdValue = parseFloat(actualBalance) * price;

        balances[token.canister_id] = {
          in_tokens: balance || BigInt(0),
          in_usd: formatToNonZeroDecimal(usdValue),
        };
      } catch (err) {
        console.error(`Error fetching balance for ${token.canister_id}:`, err);
        // Optionally provide more details from 'err'
        balances[token.canister_id] = {
          in_tokens: BigInt(0),
          in_usd: formatToNonZeroDecimal(0),
        };
      }
    }

    return balances;
  }

  public static async fetchBalance(token: FE.Token): Promise<string> {
    const wallet = get(walletStore);
    const balance = await IcrcService.getIcrc1Balance(
      token,
      wallet.account.owner
    );
    return balance.toString();
  }

  public static async fetchPrices(tokens: FE.Token[]): Promise<Record<string, number>> {
    const poolData = await PoolService.fetchPoolsData();
    const prices: Record<string, number> = {};

    for (const token of tokens) {
      const usdtPool = poolData.pools.find(pool => 
        (pool.address_0 === token.canister_id && pool.symbol_1 === "ckUSDT") ||
        (pool.address_1 === token.canister_id && pool.symbol_0 === "ckUSDT")
      );

      if (usdtPool) {
        prices[token.canister_id] = usdtPool.price;
      } else {
        const icpPool = poolData.pools.find(pool => 
          (pool.address_0 === token.canister_id && pool.symbol_1 === "ICP")
        );

        if (icpPool) {
          const icpUsdtPrice = await this.getUsdtPriceForToken("ICP", poolData.pools);
          prices[token.canister_id] = icpUsdtPrice * icpPool.price;
        } else {
          prices[token.canister_id] = 0;
        }
      }
    }

    return prices;
  }

  public static async fetchPrice(token: FE.Token): Promise<number> {
    const poolData = get(poolStore);
    
    const relevantPools = poolData.pools.filter(pool => 
        pool.address_0 === token.canister_id || 
        pool.address_1 === token.canister_id
    );

    if (relevantPools.length === 0) return 0;

    let totalWeight = 0n;
    let weightedPrice = 0;

    for (const pool of relevantPools) {
        let price: number;
        let weight: bigint;

        if (pool.address_0 === token.canister_id) {
            if (pool.symbol_1 === "ICP") {
              const icpPrice = await this.getUsdtPriceForToken("ICP", poolData.pools);
              const usdtPrice = pool.price * icpPrice;
              price = usdtPrice;
            } else {
                price = pool.price * (await this.getUsdtPriceForToken(pool.symbol_1, poolData.pools));
            }
            weight = pool.balance_0;
        } else {
            if (pool.symbol_0 === "ckUSDT") {
                price = 1 / pool.price;
            } else {
                price = (1 / pool.price) * (await this.getUsdtPriceForToken(pool.symbol_0, poolData.pools));
            }
            weight = pool.balance_1;
        }

        if (price > 0 && weight > 0n) {
            weightedPrice += Number(weight) * price;
            totalWeight += weight;
        }
    }

    return totalWeight > 0n ? weightedPrice / Number(totalWeight) : 0;
  }

  private static async getUsdtPriceForToken(symbol: string, pools: BE.Pool[]): Promise<number> {
    const usdtPool = pools.find(
      (p) =>
        (p.symbol_0 === symbol && p.symbol_1 === 'ckUSDT') ||
        (p.symbol_1 === symbol && p.symbol_0 === 'ckUSDT')
    );

    if (usdtPool) {
      const price =
        usdtPool.symbol_1 === 'ckUSDT'
          ? usdtPool.price
          : 1 / usdtPool.price;
      return price;
    }

    const icpPrice = await this.getUsdtPriceViaICP(symbol, pools);
    if (icpPrice > 0) {
      return icpPrice;
    }

    console.warn(`Unable to determine USDT price for token: ${symbol}`);
    return 0;
  }

  private static async getUsdtPriceViaICP(symbol: string, pools: BE.Pool[]): Promise<number> {
    const tokenIcpPool = pools.find(
      (p) =>
        (p.symbol_0 === symbol && p.symbol_1 === 'ICP') ||
        (p.symbol_1 === symbol && p.symbol_0 === 'ICP')
    );

    const icpUsdtPool = pools.find(
      (p) =>
        (p.symbol_0 === 'ICP' && p.symbol_1 === 'ckUSDT') ||
        (p.symbol_1 === 'ICP' && p.symbol_0 === 'ckUSDT')
    );

    if (tokenIcpPool && icpUsdtPool) {
      const tokenPriceInIcp =
        tokenIcpPool.symbol_1 === 'ICP'
          ? tokenIcpPool.price
          : 1 / tokenIcpPool.price;

      const icpPriceInUsdt =
        icpUsdtPool.symbol_1 === 'ckUSDT'
          ? icpUsdtPool.price
          : 1 / icpUsdtPool.price;

      const combinedPrice = tokenPriceInIcp * icpPriceInUsdt;
      return combinedPrice;
    }

    console.warn(`No ICP pools found for token: ${symbol}`);
    return 0;
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

  public static async fetchTokenLogo(token: FE.Token): Promise<string> {
    try {
      const actor = await getActor(token.canister_id, 'icrc1');
      const res = await actor.icrc1_metadata();
      const logoEntry = res.find(
        ([key]) => key === 'icrc1:logo' || key === 'icrc1_logo'
      );

      if (logoEntry && logoEntry[1]?.Text) {
        return logoEntry[1].Text;
      }

      if (token.canister_id === ICP_CANISTER_ID) {
        return '/tokens/icp.webp';
      } else {
        return '/tokens/not_verified.webp';
      }
    } catch (error) {
      console.log(error);
      console.error('Error getting icrc1 token metadata:', token);

      if (token.canister_id === ICP_CANISTER_ID) {
        return '/tokens/icp.webp';
      } else {
        return '/tokens/not_verified.webp';
      }
    }
  }

  public static async fetchUserTransactions(principalId: string, tokenId = ""): Promise<any> {
    const actor = await getActor();
    return await actor.txs([true]);
  }

  public static async claimFaucetTokens(): Promise<void> {
    try {
      const kongFaucetId = process.env.CANISTER_ID_KONG_FAUCET;
      const actor = await getActor(kongFaucetId, 'kong_faucet');
      await actor.claim();
    } catch (error) {
      console.error('Error claiming faucet tokens:', error);
    }
  }

  private static async calculate24hVolume(token: FE.Token, pools: BE.Pool[]): Promise<bigint> {
    let total24hVolume = 0n;

    pools.forEach(pool => {
      if (pool.address_0 === token.canister_id || pool.address_1 === token.canister_id) {
        if (pool.rolling_24h_volume) {
          total24hVolume += pool.rolling_24h_volume;
        }
      }
    });

    return total24hVolume;
  }

  private static async fetchTokenFee(token: FE.Token): Promise<bigint> {
    try {
      if (token.canister_id === ICP_CANISTER_ID) {
        // For ICP, use the standard transaction fee
        // ICP's fee is typically 10,000 e8s (0.0001 ICP)
        return BigInt(10000);
      } else {
        const actor = await getActor(token.canister_id, 'icrc1');
        const fee = await actor.icrc1_fee();
        return fee;
      }
    } catch (error) {
      console.error(`Error fetching fee for ${token.symbol}:`, error);
      // Provide a default fee if necessary
      return BigInt(10000); // Adjust default fee as appropriate
    }
  }
} 
