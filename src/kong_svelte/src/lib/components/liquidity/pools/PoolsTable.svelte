<script lang="ts">
  import TableHeader from "$lib/components/common/TableHeader.svelte";
  import PoolRow from "./PoolRow.svelte";
  import { writable } from "svelte/store";
  import TextInput from "$lib/components/common/TextInput.svelte";
  import { ArrowUp, ArrowDown, ArrowUpDown, Search } from 'lucide-svelte';
  import AddLiquidityModal from "$lib/components/liquidity/add_liquidity/AddLiquidityModal.svelte";
  
  export let pools: BE.Pool[] = [];
  export let loading = false;
  export let error: string | null = null;
  export let sortColumn: string;
  export let sortDirection: "asc" | "desc";
  export let tokenMap: Map<string, any>;

  let searchTerm = "";
  let showAddLiquidityModal = false;
  let selectedTokens = { token0: '', token1: '' };

  // Add tab state
  let activeTab = writable("all_pools");

  function handleAddLiquidity(token0: string, token1: string) {
    selectedTokens = { token0, token1 };
    showAddLiquidityModal = true;
  }

  $: filteredPools = pools.filter(pool => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return pool.symbol_0.toLowerCase().includes(searchLower) || 
           pool.symbol_1.toLowerCase().includes(searchLower) ||
           (pool.symbol_0 + '/' + pool.symbol_1).toLowerCase().includes(searchLower);
  });

  function toggleSort(column: string) {
    if (sortColumn === column) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortColumn = column;
      sortDirection = "asc";
    }
  }

  function getSortIcon(column: string) {
    if (sortColumn !== column) return ArrowUpDown;
    return sortDirection === "asc" ? ArrowUp : ArrowDown;
  }

  $: sortedAndFilteredPools = filteredPools.sort((a, b) => {
    if (!sortColumn) return 0;
    
    const direction = sortDirection === "asc" ? 1 : -1;
    switch (sortColumn) {
      case "pool":
        return (a.symbol_0 + a.symbol_1).localeCompare(b.symbol_0 + b.symbol_1) * direction;
      case "price":
        return (Number(a.price) - Number(b.price)) * direction;
      case "tvl":
        return (Number(a.tvl) - Number(b.tvl)) * direction;
      case "volume":
        return (Number(a.volume_24h) - Number(b.volume_24h)) * direction;
      case "apy":
        return (Number(a.apy) - Number(b.apy)) * direction;
      default:
        return 0;
    }
  });
</script>

<div class="table-container">
  <div class="controls-wrapper">
    <div class="controls">
      <!-- Tab buttons - mobile view -->
      <div class="tab-buttons md:hidden w-full mb-4">
        <div class="flex gap-2">
          <button 
            class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200"
            class:active={$activeTab === 'all_pools'}
            on:click={() => activeTab.set('all_pools')}
          >
            All Pools
          </button>
          <button
            class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200"
            class:active={$activeTab === 'your_pools'}
            on:click={() => activeTab.set('your_pools')}
          >
            Your Pools
          </button>
        </div>
      </div>

      <div class="flex items-center gap-4 w-full">
        <div class="search-container">
          <div class="search-wrapper">
            <Search class="search-icon mr-1" size={18} />
            <TextInput
              id="pool-search"
              placeholder="Search by token symbol or pair..."
              bind:value={searchTerm}
              size="sm"
              variant="success"
            />
          </div>
        </div>

        <!-- Tab buttons - desktop view -->
        <div class="hidden md:flex gap-2">
          <button 
            class="py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200"
            class:active={$activeTab === 'all_pools'}
            on:click={() => activeTab.set('all_pools')}
          >
            All Pools
          </button>
          <button
            class="py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200"
            class:active={$activeTab === 'your_pools'}
            on:click={() => activeTab.set('your_pools')}
          >
            Your Pools
          </button>
        </div>
      </div>
    </div>
  </div>

  {#if loading}
    <div class="loading">
      <div class="spinner" />
    </div>
  {:else if error}
    <div class="error">{error}</div>
  {:else}
    <!-- Desktop view -->
    <div class="table-scroll-container">
      <table class="w-full hidden md:table">
        <thead>
          <tr>
            <th class="text-left p-4">
              <button class="flex items-center gap-2" on:click={() => toggleSort("pool")}>
                <span>Pool</span>
                <svelte:component this={getSortIcon("pool")} size={16} />
              </button>
            </th>
            <th class="text-right p-4">
              <button class="flex items-center gap-2 ml-auto" on:click={() => toggleSort("price")}>
                <span>Price</span>
                <svelte:component this={getSortIcon("price")} size={16} />
              </button>
            </th>
            <th class="text-right p-4">
              <button class="flex items-center gap-2 ml-auto" on:click={() => toggleSort("tvl")}>
                <span>TVL</span>
                <svelte:component this={getSortIcon("tvl")} size={16} />
              </button>
            </th>
            <th class="text-right p-4">
              <button class="flex items-center gap-2 ml-auto" on:click={() => toggleSort("volume")}>
                <span>Volume (24h)</span>
                <svelte:component this={getSortIcon("volume")} size={16} />
              </button>
            </th>
            <th class="text-right p-4">
              <button class="flex items-center gap-2 ml-auto" on:click={() => toggleSort("apy")}>
                <span>APY</span>
                <svelte:component this={getSortIcon("apy")} size={16} />
              </button>
            </th>
            <th class="text-center p-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each sortedAndFilteredPools as pool, i}
            <PoolRow 
              {pool} 
              {tokenMap} 
              isEven={i % 2 === 0} 
              onAddLiquidity={handleAddLiquidity} 
            />
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Mobile view -->
    <div class="mobile-scroll-container">
      {#each sortedAndFilteredPools as pool, i}
        <PoolRow 
          {pool} 
          {tokenMap} 
          isEven={i % 2 === 0} 
          onAddLiquidity={handleAddLiquidity}
        />
      {/each}
    </div>
  {/if}
</div>

{#if showAddLiquidityModal}
  <AddLiquidityModal
    showModal={showAddLiquidityModal}
    onClose={() => showAddLiquidityModal = false}
    token0={tokenMap.get(selectedTokens.token0)}
    token1={tokenMap.get(selectedTokens.token1)}
  />
{/if}

<style lang="postcss">
  .table-container {
    @apply w-full max-w-[1400px] mx-auto flex flex-col h-full md:max-h-[calc(100vh-16rem)];
  }

  .controls-wrapper {
    @apply w-full;
  }

  .controls {
    @apply flex flex-col md:flex-row justify-between items-center mb-4 gap-4 flex-shrink-0;
  }

  .table-scroll-container {
    @apply hidden md:block overflow-auto flex-grow;
    height: calc(100vh - 16rem);
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
  }

  .table-scroll-container::-webkit-scrollbar {
    @apply w-1.5;
  }

  .table-scroll-container::-webkit-scrollbar-track {
    @apply bg-transparent;
  }

  .table-scroll-container::-webkit-scrollbar-thumb {
    @apply bg-white/30 rounded-full;
  }

  .table-scroll-container::-webkit-scrollbar-thumb:hover {
    @apply bg-white/40;
  }

  .mobile-scroll-container {
    @apply md:hidden overflow-auto flex-grow;
    height: calc(100vh - 16rem);
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
  }

  .mobile-scroll-container::-webkit-scrollbar {
    @apply w-1.5;
  }

  .mobile-scroll-container::-webkit-scrollbar-track {
    @apply bg-transparent;
  }

  .mobile-scroll-container::-webkit-scrollbar-thumb {
    @apply bg-white/30 rounded-full;
  }

  .mobile-scroll-container::-webkit-scrollbar-thumb:hover {
    @apply bg-white/40;
  }

  .search-container {
    @apply flex-1 max-w-full md:max-w-[400px];
  }

  .search-wrapper {
    @apply relative flex items-center bg-white/10 rounded-lg px-3;
  }

  :global(.search-wrapper input) {
    @apply bg-transparent border-none py-3 px-0 w-full text-white;
  }

  :global(.search-wrapper input::placeholder) {
    @apply text-white/60;
  }

  button.active {
    @apply bg-emerald-500 text-white;
  }

  button:not(.active) {
    @apply bg-white/10 text-white/60 hover:bg-white/20;
  }

  table {
    @apply w-full border-collapse border-spacing-0 bg-white/5 rounded-lg overflow-hidden;
  }

  th {
    @apply text-sm font-medium text-white/60 p-4 border-b border-white/10 bg-white/5;
  }

  .loading {
    @apply flex justify-center items-center h-[200px];
  }

  .spinner {
    @apply w-10 h-10 border-4 border-white/10 border-l-emerald-500 rounded-full;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error {
    @apply text-red-500 text-center p-4;
  }

  th button {
    @apply text-sm font-medium text-white/60 hover:text-white transition-colors duration-200;
  }
</style>
