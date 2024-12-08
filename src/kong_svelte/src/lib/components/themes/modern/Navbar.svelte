<script lang="ts">
  import Button from "$lib/components/common/Button.svelte";
  import Panel from "../../common/Panel.svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { browser } from "$app/environment";
  import { t } from "$lib/services/translations";
  import { auth } from "$lib/services/auth";
  import { fade, slide } from "svelte/transition";

  export let activeTab: "swap" | "earn" | "stats";
  export let sidebarOpen: boolean;
  let isModalOpen: boolean;
  export let isMobile: boolean;
  export let onTabChange: (tab: "swap" | "earn" | "stats") => void;
  export let onConnect: () => void;
  export let onOpenSettings: () => void;

  let isSpinning = false;
  let navOpen = false;
  const tabs = ["swap", "earn"] as const;

  function handleNavClose() {
    navOpen = false;
  }
</script>

<Panel 
  variant="blue" 
  type="main" 
  className="modern-nav-mobile" 
  roundedBorders={false}
>
  <div class="nav-container-wrapper">
    <div class="nav-container">
      {#if isMobile}
        <div class="left-section">
          <button
            class="mobile-icon-btn"
            on:click={() => (navOpen = !navOpen)}
            aria-label="Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="4" y1="12" x2="20" y2="12"></line>
              <line x1="4" y1="6" x2="20" y2="6"></line>
              <line x1="4" y1="18" x2="20" y2="18"></line>
            </svg>
          </button>
        </div>
      {:else}
        <div class="left-section">
          <nav class="nav-tabs">
            {#each tabs as tab}
              <a
                href="#{tab}"
                class="nav-link {activeTab === tab ? 'active' : ''}"
                on:click|preventDefault={() => onTabChange(tab)}
              >
                {tab.toUpperCase()}
              </a>
            {/each}
            <a
              href="#stats"
              class="nav-link {activeTab === 'stats' ? 'active' : ''}"
              on:click|preventDefault={() => onTabChange('stats')}
            >
              STATS
            </a>
          </nav>
        </div>
      {/if}

      <div class="center-section">
        <a href="/" class="logo-link">
          <img src="/titles/logo-white-wide.png" alt="Kong Logo" class="logo-wide" />
        </a>
      </div>

      {#if isMobile}
        <div class="right-section">
          <button
            class="mobile-icon-btn"
            on:click={onConnect}
            aria-label="Wallet"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
              <path d="M20 12v4H6a2 2 0 0 0-2 2c0 1.1.9 2 2 2h12v-4" />
              <path d="M20 8v8" />
            </svg>
          </button>
        </div>
      {:else}
        <div class="right-section">
          <button
            class="nav-link settings-btn"
            class:spinning={isSpinning}
            on:click={onOpenSettings}
            aria-label="Settings"
          >
            <div class="btn-content">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
              </svg>
            </div>
          </button>

          <a
            href="#"
            class="nav-link wallet-btn"
            class:selected={sidebarOpen}
            on:click|preventDefault={onConnect}
          >
            <div class="btn-content">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
                <path d="M20 12v4H6a2 2 0 0 0-2 2c0 1.1.9 2 2 2h12v-4" />
                <path d="M20 8v8" />
              </svg>
              <span class="wallet-text">
                {$auth.isConnected ? $t("common.openDrawer") : $t("common.connect")}
              </span>
            </div>
          </a>
        </div>
      {/if}
    </div>
  </div>
</Panel>

{#if navOpen && isMobile}
  <div class="mobile-menu" transition:fade={{ duration: 200 }}>
    <div class="mobile-menu-overlay" on:click={handleNavClose} />
    <div class="mobile-menu-content" transition:slide={{ duration: 200, axis: 'x' }}>
      <div class="mobile-menu-header">
        <h2 class="mobile-menu-title">Menu</h2>
        <button
          class="mobile-close-btn"
          on:click={handleNavClose}
          aria-label="Close menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <nav class="mobile-nav">
        {#each [...tabs, "stats"] as tab}
          <button
            class="mobile-nav-btn {activeTab === tab ? 'active' : ''}"
            on:click={() => {
              onTabChange(tab);
              handleNavClose();
            }}
          >
            {tab.toUpperCase()}
            <svg class="mobile-nav-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        {/each}

        <button
          class="mobile-nav-btn"
          on:click={() => {
            onOpenSettings();
            handleNavClose();
          }}
        >
          SETTINGS
          <svg class="mobile-nav-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </nav>

      <div class="mobile-menu-footer">
        <Button
          text={$auth.isConnected ? $t("common.openDrawer") : $t("common.connect")}
          variant="yellow"
          size="medium"
          state={sidebarOpen ? "selected" : "default"}
          onClick={() => {
            onConnect();
            handleNavClose();
          }}
        />
      </div>
    </div>
  </div>
{/if}

<style>
  @font-face {
    font-family: 'Alumni Sans';
    src: url('/fonts/Alumni-Sans-Latin.woff2') format('woff2');
    font-weight: normal;
    font-style: normal;
  }

  .nav-container-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .nav-container {
    width: 100%;
    max-width: 1200px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 0.5rem;
    position: relative;
  }

  @media (min-width: 819px) {
    .nav-container {
      padding: 0 1rem;
    }
  }

  /* Section Layout */
  .left-section, .right-section {
    flex: 0 0 auto;
    width: 80px;
    display: flex;
    align-items: center;
  }
  .left-section { justify-content: flex-start; }
  .center-section { 
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0 1rem;
  }
  .right-section { justify-content: flex-end; gap: 0.75rem; }

  /* Navigation */
  .nav-tabs { display: flex; align-items: center; gap: 0.75rem; }

  .nav-link {
    padding: 0.75rem 1.25rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: white;
    border-radius: 0.75rem;
    letter-spacing: 0.05em;
    position: relative;
    overflow: hidden;
    transition: all 0.2s ease;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.15);
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-link:hover { 
    color: white;
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow: 0 0 12px rgba(255, 255, 255, 0.1);
  }
  
  .nav-link.active, .nav-link.selected {
    color: white;
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.4);
    box-shadow: 0 0 16px rgba(255, 255, 255, 0.15);
  }

  /* Button Content Layout */
  .btn-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  /* Settings Button */
  .settings-btn {
    padding: 0.75rem;
    min-width: 40px;
    width: 40px;
  }

  .settings-btn.spinning svg {
    animation: spin 1s linear infinite;
  }

  /* Wallet Button */
  .wallet-btn {
    min-width: 120px;
    background: rgba(88, 101, 242, 0.2);
    border-color: rgba(88, 101, 242, 0.3);
  }

  .wallet-btn:hover {
    background: rgba(88, 101, 242, 0.3);
    border-color: rgba(88, 101, 242, 0.4);
    box-shadow: 0 0 12px rgba(88, 101, 242, 0.2);
  }

  .wallet-btn.selected {
    background: rgba(88, 101, 242, 0.4);
    border-color: rgba(88, 101, 242, 0.5);
    box-shadow: 0 0 16px rgba(88, 101, 242, 0.25);
  }

  .wallet-text {
    font-size: 0.875rem;
    font-weight: 600;
  }

  /* Right Section Layout */
  .right-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Mobile Adjustments */
  @media (max-width: 818px) {
    .nav-link {
      height: 36px;
      padding: 0.5rem 1rem;
    }

    .settings-btn {
      padding: 0.5rem;
      min-width: 36px;
      width: 36px;
    }

    .wallet-btn {
      min-width: 100px;
    }

    .left-section, .right-section {
      width: 60px;
    }

    .center-section {
      padding: 0 0.5rem;
    }

    .logo-link {
      max-width: 280px;
    }

    .logo-wide {
      height: 2.5rem;
      object-fit: contain;
    }
  }

  /* Logo */
  .logo-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: 400px;
  }

  .logo-wide {
    width: 100%;
    height: 2rem;
  }

  /* Mobile Icons */
  .mobile-icon-btn {
    padding: 0.75rem;
    color: white;
    border-radius: 0.75rem;
    transition: all 0.2s;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .mobile-icon-btn:hover {
    color: white;
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow: 0 0 12px rgba(255, 255, 255, 0.1);
  }

  .mobile-icon-btn:active {
  }

  /* Mobile specific styles */
  @media (max-width: 639px) {
    .mobile-icon-btn {
      padding: 0.5rem;
    }
    
    .center-section {
      padding: 0 0.5rem;
    }
  }

  /* Mobile Menu */
  .mobile-menu {
    position: fixed;
    inset: 0;
    z-index: 100;
  }

  .mobile-menu-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
  }

  .mobile-menu-content {
    position: absolute;
    top: 0;
    left: 0;
    width: 80%;
    max-width: 320px;
    height: 100%;
    background: rgba(13, 19, 31, 0.98);
    backdrop-filter: blur(24px);
    border-right: 1px solid rgba(78, 114, 178, 0.25);
    display: flex;
    flex-direction: column;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.2);
  }

  /* Mobile Menu Styles */
  .mobile-menu-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .mobile-menu-title {
    font-family: 'Alumni Sans', sans-serif;
    font-size: 1.75rem;
    color: white;
    margin: 0;
    background: linear-gradient(135deg, #ffffff 0%, #ffd700 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .mobile-close-btn {
    padding: 0.5rem;
    color: rgba(255, 255, 255, 0.8);
    border-radius: 0.5rem;
    transition: all 0.2s;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .mobile-close-btn:hover {
    color: white;
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 0 12px rgba(255, 255, 255, 0.1);
  }

  .mobile-nav {
    flex: 1;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .mobile-nav-btn {
    width: 100%;
    padding: 1rem 1.25rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: rgba(255, 255, 255, 0.8);
    font-size: 1.125rem;
    font-weight: 500;
    letter-spacing: 0.05em;
    border-radius: 0.75rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.2s;
  }

  .mobile-nav-btn:hover {
    color: white;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 12px rgba(255, 255, 255, 0.1);
  }

  .mobile-nav-btn.active {
    color: white;
    background: rgba(255, 215, 0, 0.15);
    border-color: rgba(255, 215, 0, 0.3);
    box-shadow: 0 0 16px rgba(255, 215, 0, 0.1);
  }

  .mobile-nav-arrow {
    opacity: 0.5;
    transition: opacity 0.2s;
  }

  .mobile-nav-btn:hover .mobile-nav-arrow {
    opacity: 1;
  }

  .mobile-menu-footer {
    padding: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.2);
  }
</style>
