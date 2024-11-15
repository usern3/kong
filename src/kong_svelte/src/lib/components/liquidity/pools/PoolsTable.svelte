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
  let pageSize = 10;
  let currentPage = 1;

  const activeSorts = writable<Record<string, "asc" | "desc" | null>>({
    price: null,
    rolling_24h_volume: null,
    rolling_24h_apy: null,
    tvl: null
  });

  const headers = [
    { label: "Pair", column: "symbol", textClass: "text-left", sortable: false },
    { label: "Price", column: "price", textClass: "text-right", sortable: true },
    { label: "TVL", column: "tvl", textClass: "text-right", sortable: true },
    { label: "24h Volume", column: "rolling_24h_volume", textClass: "text-right", sortable: true },
    { label: "APY", column: "rolling_24h_apy", textClass: "text-right", sortable: true },
    { label: "Actions", column: "actions", textClass: "text-center", sortable: false }
  ];

  $: filteredPools = pools.filter(pool => {
    const searchLower = searchTerm.toLowerCase();
    return !searchTerm || 
      pool.symbol_0.toLowerCase().includes(searchLower) || 
      pool.symbol_1.toLowerCase().includes(searchLower) ||
      (pool.symbol_0 + '/' + pool.symbol_1).toLowerCase().includes(searchLower);
  });

  $: paginatedPools = filteredPools.slice(
    (currentPage - 1) * pageSize, 
    currentPage * pageSize
  );

  $: totalPages = Math.ceil(filteredPools.length / pageSize);

  function nextPage() {
    if (currentPage < totalPages) currentPage++;
  }

  function prevPage() {
    if (currentPage > 1) currentPage--;
  }

  function handleSort(column: string) {
    $activeSorts = Object.fromEntries(
      Object.entries($activeSorts).map(([key, value]) => {
        if (key === column) {
          if (value === null) return [key, "desc"];
          if (value === "desc") return [key, "asc"];
          return [key, null];
        }
        return [key, value];
      })
    );

    let sortedPools = [...pools];
    const activeColumns = Object.entries($activeSorts)
      .filter(([_, dir]) => dir !== null)
      .map(([col, dir]) => ({ column: col, direction: dir }));

    sortedPools.sort((a: any, b: any) => {
      for (const sort of activeColumns) {
        const aVal = sort.column === 'price' ? 
          tokenMap.get(a.address_0)?.price ?? 0 : 
          a[sort.column];
        const bVal = sort.column === 'price' ? 
          tokenMap.get(b.address_0)?.price ?? 0 : 
          b[sort.column];

        if (aVal === bVal) continue;

        const modifier = sort.direction === 'asc' ? 1 : -1;
        return aVal > bVal ? modifier : -modifier;
      }
      return 0;
    });

    pools = sortedPools;
  }

  function handleAddLiquidity(token0: string, token1: string) {
    selectedTokens = { token0, token1 };
    showAddLiquidityModal = true;
  }
</script>

<div class="table-container">
  <div class="controls">
    <div class="search-container">
      <div class="search-wrapper">
        <Search class="search-icon mr-1" size={18} />
        <TextInput
          id="pool-search"
          placeholder="Search by token symbol or pair..."
          value={searchTerm}
          on:input={(e) => searchTerm = e.target.value}
          size="sm"
          variant="success"
        />
      </div>
    </div>

    <div class="page-size">
      <span>Rows per page:</span>
      <select bind:value={pageSize}>
        <option value={10}>10</option>
        <option value={25}>25</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
      </select>
    </div>
  </div>

  {#if loading}
    <div class="loading">
      <div class="spinner" />
    </div>
  {:else if error}
    <div class="error">{error}</div>
  {:else}
    <table>
      <thead>
        <tr>
          {#each headers as header}
            <th class={header.textClass}>
              <div class="header-content" style="justify-content: {header.textClass === 'text-right' ? 'flex-end' : 'flex-start'}">
                <span>{header.label}</span>
                {#if header.sortable}
                  <button class="sort-btn" on:click={() => handleSort(header.column)}>
                    {#if $activeSorts[header.column] === 'asc'}
                      <ArrowUp class="sort-icon active" />
                    {:else if $activeSorts[header.column] === 'desc'}
                      <ArrowDown class="sort-icon active" />
                    {:else}
                      <ArrowUpDown class="sort-icon" />
                    {/if}
                  </button>
                {/if}
              </div>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each paginatedPools as pool, i (pool.address_0 + pool.address_1)}
          <PoolRow 
            {pool} 
            {tokenMap}
            isEven={i % 2 === 0}
            onAddLiquidity={handleAddLiquidity}
          />
        {/each}
      </tbody>
    </table>
  {/if}

  <div class="pagination">
    <button class="page-btn" disabled={currentPage === 1} on:click={prevPage}>
      Previous
    </button>
    
    <span>Page {currentPage} of {totalPages}</span>
    
    <button class="page-btn" disabled={currentPage === totalPages} on:click={nextPage}>
      Next
    </button>
  </div>
</div>

{#if showAddLiquidityModal}
  <AddLiquidityModal
    show={true}
    token0Id={selectedTokens.token0}
    token1Id={selectedTokens.token1}
    onClose={() => showAddLiquidityModal = false}
  />
{/if}

<style>
  .table-container {
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    gap: 1rem;
  }

  .search-container {
    flex: 1;
    max-width: 400px;
  }

  .search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 0 0.75rem;
  }

  .search-icon {
    color: #6ebd40;
    margin-right: 0.5rem;
  }

  :global(.search-wrapper input) {
    background: transparent !important;
    border: none !important;
    padding: 0.75rem 0 !important;
    width: 100%;
    color: white;
  }

  :global(.search-wrapper input::placeholder) {
    color: rgba(255, 255, 255, 0.6);
  }

  .page-size {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #fff;
  }

  .page-size select {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    color: #fff;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    overflow: hidden;
  }

  th {
    padding: 1rem 1.5rem;
    color: #fff;
    font-weight: 600;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .sort-btn {
    background: none;
    border: none;
    padding: 0.25rem;
    color: #fff;
    opacity: 0.6;
    transition: opacity 0.2s;
    cursor: pointer;
  }

  .sort-btn:hover {
    opacity: 1;
  }

  .sort-icon.active {
    opacity: 1;
    color: #6ebd40;
  }

  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.1);
    border-left-color: #6ebd40;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error {
    color: #ef4444;
    text-align: center;
    padding: 1rem;
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1.5rem;
    margin-top: 1.5rem;
    color: #fff;
  }

  .page-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    padding: 0.5rem 1.25rem;
    border-radius: 6px;
    color: #fff;
    transition: background-color 0.2s;
    font-size: 0.875rem;
    cursor: pointer;
  }

  .page-btn:not(:disabled):hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .page-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
