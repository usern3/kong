import { auth } from "$lib/services/auth";
import { PoolService } from "../../services/pools/PoolService";
import {
  formatToNonZeroDecimal,
  formatTokenAmount,
} from "$lib/utils/numberFormatUtils";
import { get } from "svelte/store";
import { CKUSDT_CANISTER_ID, ICP_CANISTER_ID } from "$lib/constants/canisterConstants";
import { poolStore } from "$lib/services/pools/poolStore";
import { Principal } from "@dfinity/principal";
import { IcrcService } from "$lib/services/icrc/IcrcService";
import { parseTokens } from "./tokenParsers";
import { kongDB } from "../db";
import { tokenStore } from "./tokenStore";
import { canisterId as kongBackendCanisterId } from "../../../../../declarations/kong_backend";
import { canisterIDLs } from "../pnp/PnpInitializer";
import { createAnonymousActorHelper } from "$lib/utils/actorUtils";
import { fetchTokens } from "../indexer/api";
import { Pr } from "svelte-flags";

export class TokenService {
  protected static instance: TokenService;
  private static priceCache = new Map<
    string,
    { price: number; timestamp: number }
  >();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  public static readonly TOKEN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  public static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  public static async fetchTokens(): Promise<FE.Token[]> {
    try {
      // Try to get cached tokens first
      const cachedTokens = await kongDB.tokens
        .where('timestamp')
        .above(Date.now() - this.TOKEN_CACHE_DURATION)
        .toArray();

      if (cachedTokens.length > 0) {
        // Refresh in background after returning cached data
        setTimeout(() => this.fetchFromNetwork(), 0);
        return cachedTokens as FE.Token[];
      }

      const tokens = await this.fetchFromNetwork();

      // Cache the fetched tokens
      kongDB.tokens.bulkPut(tokens);
      return tokens;
    } catch (error) {
      console.error("Error fetching tokens:", error);
      return [];
    }
  }

  private static async fetchFromNetwork(): Promise<FE.Token[]> {
    let retries = 3;

    while (retries > 0) {
      try {
        const result = await fetchTokens();
        const parsed = parseTokens(result);
        
        // Enrich tokens with additional data
        const enriched = await Promise.all(parsed.map(async (token) => {
          const price = await this.fetchPrice(token);
          let total24hVolume = 0;
          const tokenPools = get(poolStore).pools.filter((p: BE.Pool) => 
            p.address_0 === token.canister_id || p.address_1 === token.canister_id
          );

          // Calculate total volume synchronously since the pool data is already loaded
          total24hVolume = tokenPools.reduce((sum, pool) => {
            if (pool.rolling_24h_volume) {
              return sum + Number(pool.rolling_24h_volume.toString()) / (10 ** 6);
            }
            return sum;
          }, 0);

          const enrichedToken: FE.Token = {
            ...token,
            metrics: {
              ...token.metrics,
              market_cap: token.canister_id === CKUSDT_CANISTER_ID ? 
                (BigInt(token.metrics.total_supply) / BigInt(10 ** 6)).toString() : 
                token.metrics.market_cap,
              volume_24h: total24hVolume.toString(),
            },
            price,
          };

          return enrichedToken;
        }));

        // Cache the enriched tokens
        await Promise.all(
          enriched.filter(token => token && token.canister_id).map((token) =>
            kongDB.tokens.put({
              ...token,
              timestamp: Date.now(),
            })
          )
        );

        return enriched;
      } catch (error) {
        console.warn(`Token fetch attempt failed, ${retries - 1} retries left:`, error);
        retries--;
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    return [];
  }

  public static async clearTokenCache(): Promise<void> {
    try {
      await kongDB.tokens.clear();
    } catch (error) {
      console.error("Error clearing token cache:", error);
    }
  }

  // Optional: Add a method to get a single token from cache
  public static async getToken(canisterId: string): Promise<FE.Token | null> {
    try {
      const currentTime = Date.now();
      const token = await kongDB.tokens
        .where("canisterId")
        .equals(canisterId)
        .and(
          (token) => currentTime - token.timestamp < this.TOKEN_CACHE_DURATION,
        )
        .first();

      return token || null;
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  }

  // Optional: Add a method to update a single token in cache
  public static async updateToken(token: FE.Token): Promise<void> {
    try {
      await kongDB.tokens.put({
        ...token,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Error updating token:", error);
    }
  }

  public static async enrichTokenWithMetadata(
    tokens: FE.Token[],
  ): Promise<PromiseSettledResult<FE.Token>[]> {
    const poolData = get(poolStore);
    const BATCH_SIZE = 1000; // Process 10 tokens at a time

    const processTokenBatch = async (tokenBatch: FE.Token[]) => {
      return Promise.all(
        tokenBatch.map(async (token) => {
          try {
            const [price, fee] = await Promise.allSettled([
              this.getCachedPrice(token),
              token?.fee_fixed
                ? Promise.resolve(token.fee_fixed)
                : this.fetchTokenFee(token),
            ]);

            return {
              ...token,
              fee: fee.status === "fulfilled" ? fee.value : 0n,
              price: price.status === "fulfilled" ? price.value : 0,
            };
          } catch (error) {
            console.error(`Error enriching token ${token.symbol}:`, error);
            return null;
          }
        }),
      );
    };

    // Process tokens in batches
    const results = [];
    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      const batch = tokens.slice(i, i + BATCH_SIZE);
      const batchResults = await processTokenBatch(batch);
      results.push(...batchResults);
    }

    return results.map((r) => ({
      status: r ? "fulfilled" : "rejected",
      value: r,
    })) as PromiseSettledResult<FE.Token>[];
  }

  private static async getCachedPrice(token: FE.Token): Promise<number> {
    const cached = this.priceCache.get(token.address);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.price;
    }

    const price = await this.fetchPrice(token);
    this.priceCache.set(token.address, {
      price,
      timestamp: Date.now(),
    });
    return price;
  }

  public static async fetchBalances(
    tokens?: FE.Token[],
    principalId?: string,
    forceRefresh: boolean = false
  ): Promise<Record<string, TokenBalance>> {
    if (!tokens) tokens = get(tokenStore).tokens;
    if (!principalId && !get(auth).isConnected) return {};

    const principal = principalId ? Principal.fromText(principalId) : get(auth).account.owner;
    
    if(forceRefresh) {
      Promise.all(
        tokens.map(token => this.fetchBalance(token, principalId, true))
      );
    }
    // Use batch balance fetching
    const balances = await IcrcService.batchGetBalances(tokens, principal);
    
    // Fetch all prices in parallel
    const prices = await Promise.all(
      tokens.map(token => this.getCachedPrice(token))
    );
    
    return tokens.reduce((acc, token, index) => {
      const balance = balances.get(token.canister_id) || BigInt(0);
      const price = prices[index] || 0;
      const tokenAmount = formatTokenAmount(balance.toString(), token.decimals);
      const usdValue = parseFloat(tokenAmount) * price;
      
      acc[token.canister_id] = {
        in_tokens: balance,
        in_usd: formatToNonZeroDecimal(usdValue)
      };
      return acc;
    }, {} as Record<string, TokenBalance>);
  }

  public static async fetchBalance(
    token: FE.Token,
    principalId?: string,
    forceRefresh = false,
  ): Promise<FE.TokenBalance> {
    try {
      // Return zero balance if no token or principal
      if (!token?.canister_id || !principalId) {
        return {
          in_tokens: BigInt(0),
          in_usd: formatToNonZeroDecimal(0),
        };
      }

      // Check if principal is valid
      try {
        Principal.fromText(principalId);
      } catch (e) {
        console.warn(`Invalid principal ID: ${principalId}`);
        return {
          in_tokens: BigInt(0),
          in_usd: formatToNonZeroDecimal(0),
        };
      }

      // Check cache unless force refresh is requested
      if (forceRefresh === false) {
        const now = Date.now();
        const lastUpdate = get(tokenStore).lastBalanceUpdate?.[token.address] || 0;
        const cachedBalance = get(tokenStore).balances?.[token.address];

        if (cachedBalance && (now - lastUpdate) < 12000) { // 12 second cache
          return cachedBalance;
        }
      }

      const balance = await IcrcService.getIcrc1Balance(
        token,
        Principal.fromText(principalId),
      );

      const actualBalance = formatTokenAmount(balance.toString(), token.decimals);
      const price = await this.fetchPrice(token);
      const usdValue = parseFloat(actualBalance) * price;

      // Update last balance update time
      tokenStore.update(s => ({
        ...s,
        lastBalanceUpdate: {
          ...s.lastBalanceUpdate,
          [token.address]: Date.now()
        }
      }));

      return {
        in_tokens: balance,
        in_usd: formatToNonZeroDecimal(usdValue),
      };
    } catch (error) {
      console.error(`Error fetching balance for token ${token.address}:`, error);
      return {
        in_tokens: BigInt(0),
        in_usd: formatToNonZeroDecimal(0),
      };
    }
  }

  public static async fetchPrices(
    tokens: FE.Token[],
  ): Promise<Record<string, number>> {
    // Ensure pools are loaded first
    const poolData = await PoolService.fetchPoolsData();
    if (!poolData?.pools?.length) {
      // console.warn('No pools available for price calculation');
      return tokens.reduce((acc, token) => {
        if (token.canister_id) {
          acc[token.canister_id] = 0;
        }
        return acc;
      }, {} as Record<string, number>);
    }
    
    // Create an array of promises for all tokens
    const pricePromises = tokens.map(async (token) => {
      try {
        const price = await this.calculateTokenPrice(token, poolData.pools);
        return { 
          canister_id: token.canister_id, 
          price 
        };
      } catch (error) {
        console.warn(`Failed to calculate price for token ${token.symbol}:`, error);
        return { 
          canister_id: token.canister_id, 
          price: 0 
        };
      }
    });

    const resolvedPrices = await Promise.allSettled(pricePromises);
    const prices: Record<string, number> = {};

    // Process results and update DB
    await Promise.all(resolvedPrices.map(async (result) => {
      if (result.status === "fulfilled") {
        const { canister_id, price } = result.value;
        if (canister_id) {
          prices[canister_id] = price;
          
          try {
            const token = tokens.find(t => t.canister_id === canister_id);
            if (token) {
              await kongDB.tokens.put({
                ...token,
                price,
                timestamp: Date.now()
              });
            }
          } catch (error) {
            console.error(`Error updating token ${canister_id} in DB:`, error);
          }
        }
      }
    }));

    // Set USDT price explicitly
    if (process.env.CANISTER_ID_CKUSDT_LEDGER) {
      prices[process.env.CANISTER_ID_CKUSDT_LEDGER] = 1;
    }
    
    return prices;
  }

  private static async calculateTokenPrice(
    token: FE.Token, 
    pools: BE.Pool[]
  ): Promise<number> {
    // Special case for USDT
    if (token.canister_id === process.env.CANISTER_ID_CKUSDT_LEDGER) {
      return 1;
    }

    // Find all pools containing the token
    const relevantPools = pools.filter(pool => {
      const isMatch = pool.address_0 === token.canister_id || 
                     pool.address_1 === token.canister_id;
      return isMatch;
    });

    if (relevantPools.length === 0) {
      return 0;
    }

    // Calculate prices through different paths
    const pricePaths = await Promise.all([
      // Direct USDT path
      this.calculateDirectUsdtPrice(token, relevantPools),
      // ICP intermediary path
      this.calculateIcpPath(token, pools),
      // Other stable coin paths (could add more stable coins here)
      this.calculateStableCoinPath(token, pools)
    ]);

    // Filter out invalid prices and calculate weighted average
    const validPrices = pricePaths.filter(p => p.price > 0);
    
    if (validPrices.length === 0) {
      return 0;
    }

    // Calculate weighted average based on liquidity
    const totalWeight = validPrices.reduce((sum, p) => sum + p.weight, 0);
    const weightedPrice = validPrices.reduce((sum, p) => 
      sum + (p.price * p.weight / totalWeight), 0
    );

    return weightedPrice;
  }

  private static async calculateDirectUsdtPrice(
    token: FE.Token, 
    pools: BE.Pool[]
  ): Promise<{price: number, weight: number}> {
    const usdtPool = pools.find(pool => 
      (pool.address_0 === token.canister_id && pool.symbol_1 === "ckUSDT") ||
      (pool.address_1 === token.canister_id && pool.symbol_0 === "ckUSDT")
    );

    if (!usdtPool) {
      return { price: 0, weight: 0 };
    }

    const price = usdtPool.address_0 === token.canister_id ? 
      usdtPool.price : 
      1 / usdtPool.price;

    // Calculate weight based on total liquidity
    const weight = Number(usdtPool.balance_0) + Number(usdtPool.balance_1);

    return { price, weight };
  }

  private static async calculateIcpPath(
    token: FE.Token, 
    pools: BE.Pool[]
  ): Promise<{price: number, weight: number}> {
    const icpPool = pools.find(pool =>
      (pool.address_0 === token.canister_id && pool.symbol_1 === "ICP") ||
      (pool.address_1 === token.canister_id && pool.symbol_0 === "ICP")
    );

    if (!icpPool) {
      return { price: 0, weight: 0 };
    }

    const icpUsdtPrice = await this.getUsdtPriceForToken("ICP", pools);
    const tokenIcpPrice = icpPool.address_0 === token.canister_id ? 
      icpPool.price : 
      1 / icpPool.price;

    // Calculate weight based on total liquidity
    const weight = Number(icpPool.balance_0) + Number(icpPool.balance_1);

    return {
      price: tokenIcpPrice * icpUsdtPrice,
      weight
    };
  }

  private static async calculateStableCoinPath(
    token: FE.Token, 
    pools: BE.Pool[]
  ): Promise<{price: number, weight: number}> {
    // Could implement additional stable coin paths here (USDC, DAI, etc.)
    return { price: 0, weight: 0 };
  }

  public static async fetchPrice(token: FE.Token): Promise<number> {
    const poolData = get(poolStore);
    const relevantPools = poolData.pools.filter(
      (pool) =>
        pool.address_0 === token.canister_id ||
        pool.address_1 === token.canister_id,
    );

    if (relevantPools.length === 0) return 0;

    let totalWeight = 0n;
    let weightedPrice = 0;

    for (const pool of relevantPools) {
      let price: number;
      let weight: bigint;

      if (pool.address_0 === token.canister_id) {
        if (pool.symbol_1 === "ICP") {
          const icpPrice = await this.getUsdtPriceForToken(
            "ICP",
            poolData.pools,
          );
          const usdtPrice = pool.price * icpPrice;
          price = usdtPrice;
        } else {
          price =
            pool.price *
            (await this.getUsdtPriceForToken(pool.symbol_1, poolData.pools));
        }
        weight = pool.balance_0;
      } else {
        if (pool.symbol_0 === "ckUSDT") {
          price = 1 / pool.price;
        } else {
          price =
            (1 / pool.price) *
            (await this.getUsdtPriceForToken(pool.symbol_0, poolData.pools));
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

  private static async getUsdtPriceForToken(
    symbol: string,
    pools: BE.Pool[],
  ): Promise<number> {
    const usdtPool = pools.find(
      (p) =>
        (p.symbol_0 === symbol && p.symbol_1 === "ckUSDT") ||
        (p.symbol_1 === symbol && p.symbol_0 === "ckUSDT"),
    );

    if (usdtPool) {
      const price =
        usdtPool.symbol_1 === "ckUSDT" ? usdtPool.price : 1 / usdtPool.price;
      return price;
    }

    const icpPrice = await this.getUsdtPriceViaICP(symbol, pools);
    if (icpPrice > 0) {
      return icpPrice;
    }

    console.warn(`Unable to determine USDT price for token: ${symbol}`);
    return 0;
  }

  private static async getUsdtPriceViaICP(
    symbol: string,
    pools: BE.Pool[],
  ): Promise<number> {
    const tokenIcpPool = pools.find(
      (p) =>
        (p.symbol_0 === symbol && p.symbol_1 === "ICP") ||
        (p.symbol_1 === symbol && p.symbol_0 === "ICP"),
    );

    const icpUsdtPool = pools.find(
      (p) =>
        (p.symbol_0 === "ICP" && p.symbol_1 === "ckUSDT") ||
        (p.symbol_1 === "ICP" && p.symbol_0 === "ckUSDT"),
    );

    if (tokenIcpPool && icpUsdtPool) {
      const tokenPriceInIcp =
        tokenIcpPool.symbol_1 === "ICP"
          ? tokenIcpPool.price
          : 1 / tokenIcpPool.price;

      const icpPriceInUsdt =
        icpUsdtPool.symbol_1 === "ckUSDT"
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
      const actor = await createAnonymousActorHelper(canisterId, "icrc1");
      return await actor.icrc1_metadata();
    } catch (error) {
      console.error("Error getting icrc1 token metadata:", error);
      throw error;
    }
  }

  public static async fetchUserTransactions(): Promise<any> {
    const actor = await auth.pnp.getActor(kongBackendCanisterId, canisterIDLs.kong_backend, { anon: false, requiresSigning: false }); 
    const txs = await actor.txs([true]);
    return txs;
  }

  public static async claimFaucetTokens(): Promise<any> {
    try {
      const kongFaucetId = process.env.CANISTER_ID_KONG_FAUCET;
      const actor = await createAnonymousActorHelper(kongFaucetId, canisterIDLs.kong_faucet);
      return await actor.claim();
    } catch (error) {
      console.error("Error claiming faucet tokens:", error);
    }
  }

  public static async toggleFavorite(
    canister_id: string,
    walletId: string,
  ): Promise<void> {
    if (!walletId || !canister_id) return;

    const tokens = get(tokenStore);
    const currentFavorites = tokens.favoriteTokens[walletId] || [];
    const isFavorite = currentFavorites.includes(canister_id);

    if (isFavorite) {
      await kongDB.favorite_tokens
        .where("wallet_id")
        .equals(walletId)
        .and((favorite) => favorite.canister_id === canister_id)
        .delete();
      tokenStore.update((s) => ({
        ...s,
        favoriteTokens: {
          [walletId]: currentFavorites.filter((id) => id !== canister_id),
        },
      }));
    } else {
      await kongDB.favorite_tokens.add({
        wallet_id: walletId,
        canister_id: canister_id,
        timestamp: Date.now(),
      });
      tokenStore.update((s) => ({
        ...s,
        favoriteTokens: {
          [walletId]: [...currentFavorites, canister_id],
        },
      }));
    }
  }
  
  private static async fetchTokenFee(token: FE.Token): Promise<bigint> {
    try {
      if (token.canister_id === ICP_CANISTER_ID) {
        // For ICP, use the standard transaction fee
        // ICP's fee is typically 10,000 e8s (0.0001 ICP)
        return BigInt(10000);
      } else {
        const actor = await createAnonymousActorHelper(token.canister_id, canisterIDLs.icrc1);
        const fee = await actor.icrc1_fee();
        return BigInt(fee.toString());
      }
    } catch (error) {
      console.error(`Error fetching fee for ${token.symbol}:`, error);
      // Provide a default fee if necessary
      return BigInt(10000); // Adjust default fee as appropriate
    }
  }

  private static async calculatePriceChange24h(token: FE.Token): Promise<number> {
    // You'll need to implement this based on your historical price data
    // For now returning 0
    return 0;
  }
}
