<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import Navbar from "$lib/components/nav/Navbar.svelte";
  import Toast from "$lib/components/common/Toast.svelte";
  import { t } from "$lib/locales/translations";
  import { currentEnvMode } from "$lib/utils/envUtils";
  import { restoreWalletConnection } from "$lib/stores/walletStore";
  import { switchLocale, localeStore } from "$lib/stores/localeStore";
  import { tokenStore } from "$lib/features/tokens/tokenStore";
  import { poolStore } from "$lib/features/pools/poolStore";
  import { walletStore } from "$lib/stores/walletStore";
  import poolsBackground from "$lib/assets/backgrounds/pools.webp";
  import jungleBackground from "$lib/assets/backgrounds/kong_jungle2.webp";
  import background from "$lib/assets/backgrounds/background.gif";
  import { browser } from "$app/environment";

  let initialized: boolean = false;
  let sidebarOpen = false;

  onMount(async () => {
    if (!localeStore) {
      switchLocale("en");
    }
    Promise.all([
      restoreWalletConnection(),
      tokenStore.loadTokens(),
      poolStore.loadPools(),
      $walletStore.isConnected ? tokenStore.loadBalances() : null,
    ]);
    initialized = true;
  });

  $: if (browser) {
    if ($page.url.pathname.startsWith("/pools")) {
      document.body.style.background = `#5BB2CF url(${poolsBackground})`;
    } else if ($page.url.pathname.startsWith("/stats")) {
      document.body.style.background = "#5BB2CF";
    } else if ($page.url.pathname.startsWith("/swap")) {
      document.body.style.background = `#5BB2CF url(${background})`;
    } else {
      document.body.style.background = `#5BB2CF url(${jungleBackground})`;
    }
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
  }
</script>

<div class="app-layout">
  <Navbar />
  
  <main class="main-content">
    <slot />
  </main>
  <Toast />
</div>

<svelte:head>
  <title>
    {currentEnvMode() ? `[${currentEnvMode()}] KongSwap` : `KongSwap`} - {$t(
      "common.browserSubtitle",
    )}
  </title>
</svelte:head>

<style lang="postcss">
  .app-layout {
    display: flex;
    min-height: 100vh;
    width: 100%;
    position: relative;
  }

  .main-content {
    flex: 1;
    padding-left: 240px; /* Navbar width */
    min-height: 100vh;
    width: 100%;
    box-sizing: border-box;
  }
  /* Mobile styles */
  @media (max-width: 768px) {
    .main-content {
      padding-left: 1rem;
      padding-right: 1rem;
    }

    :global(nav) {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 70px;
      transform: none !important;
      border-right: none;
      border-top: 4px solid white;
      z-index: 50;
    }

    :global(nav .flex-col) {
      flex-direction: row !important;
      justify-content: space-around;
      padding: 0.5rem;
      height: 100%;
    }

    :global(nav .logo-container) {
      display: none;
    }

    :global(nav .navigation-button),
    :global(nav .settings-button) {
      padding: 4px 8px;
      font-size: 12px;
      width: auto;
    }

    :global(nav .mt-auto) {
      margin-top: 0 !important;
      flex-direction: row !important;
      gap: 8px !important;
    }
  }
</style>
