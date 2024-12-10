// src/lib/workers/updateWorker.ts

import * as Comlink from 'comlink';
import { DEFAULT_LOGOS } from '$lib/services/tokens/tokenLogos';

interface AssetLoadingState {
  assetsLoaded: number;
  totalAssets: number;
  errors: string[];
}

interface TokenLogoLoadedMessage {
  type: 'TOKEN_LOGOS_LOADED';
  logos: Record<string, string>;
}

interface LoadingProgressMessage {
  type: 'LOADING_PROGRESS';
  loaded: number;
  total: number;
  context: string;
  complete: boolean;
}

type WorkerMessage = TokenLogoLoadedMessage | LoadingProgressMessage;

export interface BatchPreloadResult {
  success: boolean;
  error?: string;
  loadingState: AssetLoadingState;
}

export type UpdateType = 'token' | 'pool' | 'swapActivity' | 'price';

export interface WorkerApi {
  startUpdates(): Promise<void>;
  stopUpdates(): Promise<void>;
  setTokens(tokens: FE.Token[]): Promise<void>;
}

class WorkerImpl implements WorkerApi {
  private preloadedAssets = new Set<string>();
  private objectUrls = new Set<string>();
  private loadingState: AssetLoadingState = {
    assetsLoaded: 0,
    totalAssets: 0,
    errors: []
  };

  private tokenUpdateInterval: number | null = null;
  private poolUpdateInterval: number | null = null;
  private swapActivityUpdateInterval: number | null = null;
  private priceUpdateInterval: number | null = null;
  private logoCleanupInterval: number | null = null;
  private logoRefreshInterval: number | null = null;

  private readonly INTERVALS = {
    TOKEN_UPDATE: 60000,      // 1 minute
    POOL_UPDATE: 30000,       // 30 seconds
    SWAP_ACTIVITY: 19000,     // 19 seconds
    PRICE_UPDATE: 20000,      // 20 seconds
    LOGO_CLEANUP: 3600000,    // 1 hour
    LOGO_REFRESH: 1800000     // 30 minutes
  };

  private tokens: FE.Token[] = [];

  async setTokens(tokens: FE.Token[]): Promise<void> {
    this.tokens = tokens;
  }

  async startUpdates(): Promise<void> {
    try {
      // Start periodic updates
      this.startTokenUpdates();
      this.startPoolUpdates();
      this.startSwapActivityUpdates();
      this.startPriceUpdates();
    } catch (error) {
      console.error('Worker: Error starting updates:', error);
      throw error;
    }
  }

  async stopUpdates(): Promise<void> {
    if (this.tokenUpdateInterval) clearInterval(this.tokenUpdateInterval);
    if (this.poolUpdateInterval) clearInterval(this.poolUpdateInterval);
    if (this.swapActivityUpdateInterval) clearInterval(this.swapActivityUpdateInterval);
    if (this.priceUpdateInterval) clearInterval(this.priceUpdateInterval);
    if (this.logoCleanupInterval) clearInterval(this.logoCleanupInterval);
    if (this.logoRefreshInterval) clearInterval(this.logoRefreshInterval);

    this.tokenUpdateInterval = null;
    this.poolUpdateInterval = null;
    this.swapActivityUpdateInterval = null;
    this.priceUpdateInterval = null;
    this.logoCleanupInterval = null;
    this.logoRefreshInterval = null;

    this.cleanup();
  }

  // -------------------- Private Methods --------------------

  private postUpdateMessage(updateType: UpdateType) {
    try {
      self.postMessage({ type: 'update', updateType });
    } catch (error) {
      console.error(`Worker: Failed to post ${updateType} update message:`, error);
    }
  }

  private startTokenUpdates(): void {
    if (this.tokenUpdateInterval) return;
    this.postUpdateMessage('token');
    this.tokenUpdateInterval = self.setInterval(() => {
      console.log('Worker: Token update interval triggered');
      this.postUpdateMessage('token');
    }, this.INTERVALS.TOKEN_UPDATE);
  }

  private startPoolUpdates(): void {
    if (this.poolUpdateInterval) return;
    this.postUpdateMessage('pool');
    this.poolUpdateInterval = self.setInterval(() => {
      console.log('Worker: Pool update interval triggered');
      this.postUpdateMessage('pool');
    }, this.INTERVALS.POOL_UPDATE);
  }

  private startSwapActivityUpdates(): void {
    if (this.swapActivityUpdateInterval) return;
    this.postUpdateMessage('swapActivity');
    this.swapActivityUpdateInterval = self.setInterval(() => {
      console.log('Worker: Swap activity interval triggered');
      this.postUpdateMessage('swapActivity');
    }, this.INTERVALS.SWAP_ACTIVITY);
  }

  private startPriceUpdates(): void {
    if (this.priceUpdateInterval) return;
    this.postUpdateMessage('price');
    this.priceUpdateInterval = self.setInterval(() => {
      console.log('Worker: Price update interval triggered');
      this.postUpdateMessage('price');
    }, this.INTERVALS.PRICE_UPDATE);
  }

  private cleanup() {
    this.objectUrls.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.warn(`Failed to revoke object URL: ${url}`, error);
      }
    });
    this.objectUrls.clear();
  }
}

Comlink.expose(new WorkerImpl());
