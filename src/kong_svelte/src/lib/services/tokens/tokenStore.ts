// src/kong_svelte/src/lib/features/tokens/tokenStore.ts
import { writable, derived, get, type Readable } from 'svelte/store';
import { TokenService } from '$lib/services/tokens/TokenService';
import { browser } from '$app/environment';
import { debounce } from 'lodash-es';
import { formatToNonZeroDecimal, formatTokenAmount } from '$lib/utils/numberFormatUtils';
import { toastStore } from '$lib/stores/toastStore';

interface TokenState {
  readonly tokens: FE.Token[];
  readonly balances: Record<string, FE.TokenBalance>;
  readonly prices: Record<string, number>;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly totalValueUsd: string;
  readonly lastTokensFetch: number | null;
}

const CACHE_DURATION = 1000 * 60 * 1; // 1 minute in milliseconds

// Add BigInt serialization handler
const serializeState = (state: TokenState): string => {
  return JSON.stringify(state, (key, value) => {
    // Convert BigInt to string during serialization
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  });
};

// Add BigInt deserialization handler
const deserializeState = (cachedData: string): TokenState => {
  return JSON.parse(cachedData, (key, value) => {
    // Handle potential BigInt values
    if (typeof value === 'string' && /^\d+n$/.test(value)) {
      return BigInt(value.slice(0, -1));
    }
    return value;
  });
};

// Debounced save to cache with a longer delay to reduce frequency
const saveToCache = debounce((state: TokenState) => {
  if (browser) {
    try {
      localStorage.setItem('tokenStore', serializeState(state));
    } catch (error) {
      console.error('Error saving token data to cache:', error);
    }
  }
}, 3500); // Increased debounce delay

function createTokenStore() {
  const store = writable<TokenState>({
    tokens: [],
    balances: {},
    prices: {},
    isLoading: false,
    error: null,
    totalValueUsd: '0.00',
    lastTokensFetch: null
  });

  // Load cached state on initialization
  if (browser) {
    try {
      const cached = localStorage.getItem('tokenStore');
      if (cached) {
        const cachedData = deserializeState(cached);
        store.set(cachedData);
      }
    } catch (error) {
      console.error('Error loading cached token data:', error);
    }
  }

  const shouldRefetch = (lastFetch: number | null): boolean => {
    if (!lastFetch) return true;
    return Date.now() - lastFetch > CACHE_DURATION;
  };

  const getCurrentState = (): TokenState => get(store);

  const updateState = (newState: TokenState) => {
    const currentState = get(store);
    if (serializeState(currentState) !== serializeState(newState)) {
      store.set(newState);
      saveToCache(newState);
    }
  };

  const reloadTokensAndBalances = async () => {
    try {
      await tokenStore.loadBalances();
    } catch (error) {
      console.error("Failed to reload tokens and balances:", error);
    }
  };

  return {
    subscribe: store.subscribe,
    loadTokens: async (forceRefresh = true) => {
      const currentState = getCurrentState();

      if (!forceRefresh && !shouldRefetch(currentState.lastTokensFetch)) {
        return currentState.tokens;
      }

      store.update((s) => ({ ...s, isLoading: true, tokens: [] }));

      try {
        const baseTokens = await TokenService.fetchTokens();
        console.log(baseTokens);

        // Extract IC tokens and map them to FE.Token[]
        const icTokens: FE.Token[] = baseTokens
            .filter((token): token is { IC: BE.ICToken } => token.IC !== undefined)
            .map((token) => {
                const icToken = token.IC;
                return {
                    canister_id: icToken.canister_id,
                    name: icToken.name,
                    symbol: icToken.symbol,
                    fee: icToken.fee,
                    decimals: icToken.decimals,
                    token: icToken.token,
                    token_id: icToken.token_id,
                    chain: icToken.chain,
                    icrc1: icToken.icrc1,
                    icrc2: icToken.icrc2,
                    icrc3: icToken.icrc3,
                    on_kong: icToken.on_kong,
                    pool_symbol: icToken.pool_symbol ?? "Pool not found",
                    // Optional fields
                    logo: undefined,
                    total_24h_volume: undefined,
                    price: undefined,
                    tvl: undefined,
                    balance: undefined,
                } as FE.Token;
            });

        const enrichedTokens = await TokenService.enrichTokenWithMetadata(icTokens);

        updateState({
            ...currentState,  // Preserve existing state
            tokens: enrichedTokens,
            isLoading: false,
            lastTokensFetch: Date.now(),
            error: null,
        });

        return enrichedTokens;
      } catch (error: any) {
        console.error('Error loading tokens:', error);
        updateState({
            ...currentState,  // Preserve existing state
            error: error.message,
            isLoading: false,
            tokens: []
        });
        toastStore.error('Failed to load tokens');
      }
    },
    getBalance: (canisterId: string) => {
      const currentState = getCurrentState();
      return currentState.balances[canisterId] || { in_tokens: BigInt(0), in_usd: '0' };
    },
    refreshBalance: async (token: FE.Token) => {
      const currentState = getCurrentState();
      const balance = await TokenService.fetchBalance(token);
      updateState({ ...currentState, balances: { ...currentState.balances, [token.canister_id]: { in_tokens: BigInt(balance), in_usd: '0' } } });
    },
    loadBalances: async () => {
      const currentState = getCurrentState();
      store.update(s => ({ ...s, isLoading: true }));

      try {
        const [balances, prices] = await Promise.all([
          TokenService.fetchBalances(currentState.tokens),
          TokenService.fetchPrices(currentState.tokens) // Fetch prices
        ]);

        const formattedBalances = Object.entries(balances).reduce<Record<string, FE.TokenBalance>>(
          (acc, [key, value]) => ({
            ...acc,
            [key]: value
          }), 
          {}
        );

        const newState: TokenState = {
          ...currentState,
          balances: formattedBalances,
          prices: prices,
          isLoading: false
        };

        updateState(newState);
        return formattedBalances;
      } catch (error) {
        console.error('Error loading balances:', error);
        this.clearCache();
        store.update(s => ({ 
          ...s, 
          error: error.message, 
          isLoading: false 
        }));
      }
    },
    clearCache: () => {
      if (browser) localStorage.removeItem('tokenStore');
      store.set({
        tokens: [],
        balances: {},
        prices: {},
        isLoading: false,
        error: null,
        totalValueUsd: '0.00',
        lastTokensFetch: null
      });
    },
    reloadTokensAndBalances,
    getTokenPrices: () => {
      const currentState = getCurrentState();
      return currentState.prices;
    },
  };
}

export const tokenStore = createTokenStore();

// Memoize the portfolio value calculation
const calculatePortfolioValue = (balances: Record<string, FE.TokenBalance>, tokens: FE.Token[]) => {
  let total = 0;
  // Assuming TokenService.fetchPrices is optimized for batch processing
  return TokenService.fetchPrices(tokens)
    .then(prices => {
      for (const [canisterId, balance] of Object.entries(balances)) {
        const token = tokens.find(t => t.canister_id === canisterId);
        if (token && prices[canisterId]) {
          const actualBalance = formatTokenAmount(balance.in_tokens.toString(), token.decimals);
          total += parseFloat(actualBalance) * prices[canisterId];
        }
      }
      return formatToNonZeroDecimal(total);
    })
    .catch(error => {
      console.error('Error calculating portfolio value:', error);
      return formatToNonZeroDecimal(0);
    });
};

export const portfolioValue: Readable<string> = derived(
  [tokenStore],
  ([$tokenStore]) => {
    let totalValue = 0;

    for (const token of $tokenStore.tokens) {
      const usdValue = parseFloat($tokenStore.balances[token.canister_id]?.in_usd || '0');
      totalValue += usdValue;
    }

    return formatToNonZeroDecimal(totalValue);
  }
);

// Derived store to prepare tokens with formatted values
export const formattedTokens: Readable<FE.Token[]> = derived(
  tokenStore,
  ($tokenStore) => {
    return $tokenStore.tokens.map((token) => {
      const balance = $tokenStore.balances[token.canister_id]?.in_tokens || BigInt(0);
      const usdValue = $tokenStore.balances[token.canister_id]?.in_usd || '0';

      return {
        ...token,
        formattedBalance: formatTokenAmount(balance.toString(), token.decimals),
        formattedUsdValue: formatToNonZeroDecimal(Number(usdValue)) || '0',
      };
    });
  }
);
