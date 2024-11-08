<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { browser } from "$app/environment";
  import { t } from "$lib/locales/translations";
  import { walletStore } from "$lib/stores/walletStore";
  import Modal from "../common/Modal.svelte";
  import LanguageSelector from "../common/LanguageSelector.svelte";
  import Sidebar from "../sidebar/Sidebar.svelte";

  type NavigationTab = "swap" | "pools" | "stats";
  const navigationTabs: NavigationTab[] = ["swap", "pools", "stats"];
  
  let activeTab: NavigationTab = "swap";
  let sidebarOpen = false;
  let isSettingsModalOpen = false;

  const determineActiveTab = (path: string): NavigationTab => {
    const routes: Record<string, NavigationTab> = {
      stats: "stats",
      pools: "pools",
      swap: "swap"
    };
    return Object.entries(routes).find(([key]) => path.includes(key))?.[1] ?? "swap";
  };

  function handleNavigation(tab: NavigationTab) {
    if (activeTab !== tab || $page.url.pathname !== `/${tab}`) {
      activeTab = tab;
      goto(`/${tab}`);
    }
  }

  onMount(() => {
    activeTab = determineActiveTab($page.url.pathname);
  });

  $: {
    activeTab = determineActiveTab($page.url.pathname);
  }
</script>

<!-- Desktop Navigation -->
<nav class="hidden md:flex fixed h-full w-[240px] z-50 left-0 top-0 border-r-4 border-white bg-black retro-bg">
  <div class="flex flex-col h-full p-6 gap-6">
    <!-- Logo -->
    <div class="logo-container">
      <img 
        src="/titles/logo-king-kong.svg" 
        alt="King Kong Logo" 
        class="w-full h-auto mb-4"
      />
      <div class="pixel-divider"></div>
    </div>

    <!-- Navigation Buttons -->
    <div class="flex flex-col gap-4">
      {#each navigationTabs as tab}
        <button
          class="navigation-button {activeTab === tab ? 'active' : ''}"
          on:click={() => handleNavigation(tab)}
        >
          {tab.toUpperCase()}
        </button>
      {/each}
    </div>

    <!-- Settings & Wallet -->
    <div class="mt-auto flex flex-col gap-4">
      <button
        class="settings-button"
        aria-label="Settings"
        on:click={() => (isSettingsModalOpen = true)}
      >
        <div class="flex items-center gap-2 justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="pixelated"
          >
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
          </svg>
          <span>SETTINGS</span>
        </div>
      </button>

      <button 
        class="wallet-button {sidebarOpen ? 'active' : ''}"
        on:click={() => sidebarOpen = !sidebarOpen}
      >
        <div class="flex items-center gap-2 justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="pixelated"
          >
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4h2v5h-2z" />
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5h-2v3H5V7h14v3h2V5H5a2 2 0 0 1-2 0z" />
          </svg>
          <span>{$walletStore.isConnected ? $t("common.open") : $t("common.connect")}</span>
        </div>
      </button>
    </div>
  </div>
</nav>

<!-- Mobile Navigation -->
<div class="md:hidden fixed w-full z-50">
  <!-- Top Bar -->
  <div class="flex justify-between items-center px-4 py-3 bg-black border-b-4 border-white">
    <button 
      class="menu-button"
      on:click={() => sidebarOpen = !sidebarOpen}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>
    
    <button 
      class="wallet-button-mobile"
      on:click={() => sidebarOpen = !sidebarOpen}
    >
      {$walletStore.isConnected ? $t("common.open") : $t("common.connect")}
    </button>
  </div>

  <!-- Bottom Navigation -->
  <div class="fixed bottom-0 left-0 right-0 flex justify-around bg-black border-t-4 border-white p-2">
    {#each navigationTabs as tab}
      <button
        class="mobile-nav-button {activeTab === tab ? 'active' : ''}"
        on:click={() => handleNavigation(tab)}
      >
        {tab.toUpperCase()}
      </button>
    {/each}
  </div>
</div>

<Sidebar {sidebarOpen} onClose={() => (sidebarOpen = false)} />

<Modal
  isOpen={isSettingsModalOpen}
  onClose={() => isSettingsModalOpen = false}
  title="Settings"
  width="550px"
>
  <LanguageSelector />
</Modal>

<style lang="postcss">
  .navigation-button, .wallet-button, .settings-button {
    position: relative;
    padding: 8px 16px;
    background: #1b5e20;
    color: #ffffff;
    border: 3px solid #4caf50;
    font-family: 'Press Start 2P', monospace;
    font-size: 14px;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.1s steps(2);
    box-shadow: 4px 4px 0 #000,
                3px 3px 0 #4caf50;
    image-rendering: pixelated;
  }

  .mobile-nav-button {
    padding: 8px;
    background: #1b5e20;
    color: #ffffff;
    border: 2px solid #4caf50;
    font-family: 'Press Start 2P', monospace;
    font-size: 12px;
    flex: 1;
    margin: 0 4px;
  }

  .mobile-nav-button.active {
    background: #4caf50;
    box-shadow: inset -2px -2px 0 #1b5e20;
  }

  .menu-button, .wallet-button-mobile {
    padding: 8px;
    color: #ffffff;
    background: #1b5e20;
    border: 2px solid #4caf50;
  }

  .settings-button {
    background: #b71c1c;
    border-color: #f44336;
    width: 100%;
    height: auto;
    padding: 8px 16px;
    display: block;
  }

  .navigation-button:hover, .wallet-button:hover {
    background: #4caf50;
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0 #1b5e20,
                5px 5px 0 #4caf50;
  }

  .settings-button:hover {
    background: #f44336;
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0 #b71c1c,
                5px 5px 0 #f44336;
  }

  .navigation-button:active, .wallet-button:active, .settings-button:active {
    transform: translate(4px, 4px);
    box-shadow: none;
  }

  .navigation-button.active, .wallet-button.active {
    background: #4caf50;
    box-shadow: inset -4px -4px 0 #1b5e20;
  }

  .retro-bg {
    background-image: 
      linear-gradient(0deg, 
        rgba(0, 0, 0, 0.9) 1px, 
        transparent 1px
      ),
      linear-gradient(90deg, 
        rgba(0, 0, 0, 0.9) 1px, 
        transparent 1px
      );
    background-size: 16px 16px;
    background-color: #0a0a0a;
    image-rendering: pixelated;
    box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.5);
  }

  .logo-container {
    margin: -1.5rem -1.5rem 1rem -1.5rem;
    padding: 1rem;
  }

  .pixel-divider {
    height: 4px;
    background: repeating-linear-gradient(
      to right,
      #ffffff 0,
      #ffffff 4px,
      transparent 4px,
      transparent 8px
    );
    margin: 0.5rem 0;
    image-rendering: pixelated;
    box-shadow: 0 2px 0 rgba(0, 0, 0, 0.5);
  }
</style>
