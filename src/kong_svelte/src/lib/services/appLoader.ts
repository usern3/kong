import { browser } from "$app/environment";
import { tokenStore } from "$lib/services/tokens/tokenStore";
import { poolStore } from "$lib/services/pools/poolStore";
import { get, writable, type Readable } from "svelte/store";
import { auth, canisterIDLs } from "$lib/services/auth";
import { assetCache } from "$lib/services/assetCache";
import { canisterId as kongBackendCanisterId } from "../../../../declarations/kong_backend";
import { updateWorkerService } from "$lib/services/updateWorkerService";

interface LoadingState {
  isLoading: boolean;
  assetsLoaded: number;
  totalAssets: number;
  errors: string[];
}

export class AppLoader {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private isInitialized = false;

  // Create a writable store for loading state
  private _loadingState = writable<LoadingState>({
    isLoading: true,
    assetsLoaded: 0,
    totalAssets: 0,
    errors: [],
  });

  // Expose only the readable store
  public loadingState: Readable<LoadingState> = {
    subscribe: this._loadingState.subscribe,
  };

  public updateLoadingState(partial: Partial<LoadingState>) {
    const current = get(this._loadingState);
    this._loadingState.set({
      ...current,
      ...partial,
      // Only update progress if new values are provided
      assetsLoaded: partial.assetsLoaded ?? current.assetsLoaded,
      totalAssets: partial.totalAssets ?? current.totalAssets,
    });
  }

  private async initializeWallet(): Promise<void> {
    try {
      // Initialize wallet connection using auth service
      // Add your wallet initialization logic here
    } catch (error) {
      console.error("Failed to initialize wallet:", error);
      this.updateLoadingState({
        errors: [
          ...get(this._loadingState).errors,
          "Failed to initialize wallet",
        ],
      });
    }
  }

  // Asset preloading with priority, batching, and tracking
  private shouldSkipPreload(url: string): boolean {
    return url.startsWith("data:image/") || url.startsWith("blob:");
  }

  /**
   * Determines the type of asset based on its file extension.
   * @param url The URL of the asset.
   * @returns The asset type: "svg", "image", or "other".
   */
  private determineAssetType(url: string): "svg" | "image" | "other" {
    const extension = url.split(".").pop()?.toLowerCase();
    if (extension === "svg") return "svg";
    const imageExtensions = [
      "png",
      "jpg",
      "jpeg",
      "webp",
      "gif",
      "bmp",
      "ico",
      "svg",
    ];
    if (extension && imageExtensions.includes(extension)) return "image";
    return "other";
  }

  private async preloadAsset(
    url: string,
    priority: "high" | "low" = "high",
  ): Promise<void> {
    if (!browser || this.shouldSkipPreload(url)) {
      return;
    }

    try {
      // Get cached or fetch new asset
      const assetUrl = await assetCache.getAsset(url);
      const type = this.determineAssetType(url);

      if (type === "svg") {
        const response = await fetch(assetUrl);
        if (!response.ok) {
          throw new Error(`Failed to load SVG: ${response.statusText}`);
        }
        const svgContent = await response.text();
        if (!svgContent.includes("<svg")) {
          throw new Error("Invalid SVG content");
        }
      } else if (type === "image") {
        // For regular images, use the Image object loading approach
        await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(undefined);
          img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
          img.src = assetUrl;
        });
      } else {
        console.warn(`Unsupported asset type for URL: ${url}`);
      }

      // Update loading progress
      this._loadingState.update((state) => ({
        ...state,
        assetsLoaded: state.assetsLoaded + 1,
      }));
    } catch (error) {
      console.error(`Failed to preload asset ${url}:`, error);
      this._loadingState.update((state) => ({
        ...state,
        errors: [...state.errors, `Failed to load ${url}`],
        // Still increment loaded count even on error to ensure progress continues
        assetsLoaded: state.assetsLoaded + 1,
      }));
    }
  }

  // Component assets configuration
  private buttonSizeVariants = {
    small: ["green", "yellow"], // btnsmall only has green and yellow
    medium: ["blue", "green", "yellow"],
    big: ["blue", "green", "yellow"],
  };

  private buttonStates = ["default", "pressed", "selected"];
  private mainPanelVariants = ["green", "red"];
  private secondaryPanelVariants = ["green"];
  private panelParts = ["tl", "tm", "tr", "ml", "mr", "bl", "bm", "br"];

  private getRequiredComponentAssets(): string[] {
    const components: string[] = [];

    // Generate button components
    Object.entries(this.buttonSizeVariants).forEach(([size, variants]) =>
      variants.forEach((variant) =>
        this.buttonStates.forEach((state) => {
          const prefix =
            size === "small" ? "btnsmall" : size === "big" ? "bigbtn" : "btn";
          components.push(
            `/pxcomponents/${prefix}-${variant}-${state}-l.svg`,
            `/pxcomponents/${prefix}-${variant}-${state}-mid.svg`,
            `/pxcomponents/${prefix}-${variant}-${state}-r.svg`,
          );
        }),
      ),
    );

    // Add main panel components
    this.mainPanelVariants.forEach((variant) => {
      this.panelParts.forEach((part) => {
        components.push(`/pxcomponents/panel-${variant}-main-${part}.svg`);
      });
    });

    // Add secondary panel components (no ml/mr parts)
    this.secondaryPanelVariants.forEach((variant) => {
      this.panelParts.forEach((part) => {
        if (!["ml", "mr"].includes(part)) {
          components.push(`/pxcomponents/panel-s-${variant}-${part}.svg`);
        }
      });
    });

    return components;
  }

  private backgrounds = [
    "/backgrounds/pools.webp",
    "/backgrounds/kong_jungle2.webp",
    "/backgrounds/grass.webp",
    "/backgrounds/skyline.svg",
  ];

  private async preloadAssets(): Promise<void> {
    try {
      const requiredComponents = this.getRequiredComponentAssets();
      const allAssets = [...requiredComponents, ...this.backgrounds];
      
      this.updateLoadingState({
        totalAssets: allAssets.length,
      });

      const result = await updateWorkerService.preloadAssets(allAssets);
      this.updateLoadingState({
        assetsLoaded: result.loaded,
        errors: result.errors
      });
    } catch (error) {
      console.error('Failed to preload assets:', error);
      this.updateLoadingState({
        errors: [...get(this._loadingState).errors, 'Failed to preload assets'],
      });
    }
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized || !browser) return;

    let initError = null;
    
    try {
      this._loadingState.set({
        isLoading: true,
        assetsLoaded: 0,
        totalAssets: 0,
        errors: [],
      });

      // Initialize core services first
      await Promise.all([
        this.initializeWallet(),
        this.initializeTokens()
      ]);

      // Initialize worker and wait for initial data
      const workerInitialized = await updateWorkerService.initialize();
      if (!workerInitialized) {
        console.warn('Worker initialization failed, continuing with fallback updates');
      }

      // Wait for token logos to load
      const logosLoaded = await updateWorkerService.loadTokenLogos();

      // Load UI assets
      await this.preloadAssets();

      // Initialize remaining services
      await Promise.all([
        this.initializePools(),
        tokenStore.loadPrices(),
        this.initializeSettings()
      ]);

      // Set initialization flag
      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize app:", error);
      initError = error;
    } finally {
      // Only close loading screen if worker is ready or fallback is active
      if (updateWorkerService.getIsInitialized() || initError) {
        this.updateLoadingState({
          isLoading: false,
          errors: initError
            ? [
                ...get(this._loadingState).errors,
                initError.message || "Failed to initialize app",
              ]
            : [],
        });
      }
    }
  }

  private async initializeTokens(): Promise<void> {
    try {
      // Initialize tokens after wallet connection
      const wallet = get(auth);

      // Load tokens and wait for completion
      await Promise.all([tokenStore.loadTokens()]);

      // If wallet is connected, load balances
      if (wallet?.isConnected && wallet?.account?.owner) {
        await tokenStore.loadBalances(wallet.account.owner);
      }
    } catch (error) {
      console.error("Failed to initialize tokens:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Token initialization failed: ${errorMessage}`);
    }
  }

  private async initializePools(): Promise<void> {
    try {
      // Wait for tokens to be loaded since pools depend on token information
      // Initialize pools using auth service
      // Add your pool initialization logic here
      poolStore.loadPools();
      poolStore.loadUserPoolBalances();
    } catch (error) {
      console.error("Failed to initialize pools:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Pool initialization failed: ${errorMessage}`);
    }
  }

  private async initializeSettings(): Promise<void> {
    try {
      console.log("Initializing settings...");
      const kongBackendActor = await auth.getActor(
        kongBackendCanisterId,
        canisterIDLs.kong_backend,
        { anon: true },
      );
      // Initialize settings using the actor
      // Add your settings initialization logic here
      console.log("Settings initialized successfully");
    } catch (error) {
      console.error("Settings initialization error:", error);
      throw error;
    }
  }

  public destroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

export const appLoader = new AppLoader();
