<script lang="ts">
  import TableHeader from "$lib/components/common/TableHeader.svelte";
  import PoolRow from "./PoolRow.svelte";
  import type { Pool } from "./types";
  import { writable } from "svelte/store";
  import TextInput from "$lib/components/common/TextInput.svelte";
  import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-svelte';
  
  export let pools: Pool[] = [];
  export let loading = false;
  export let error: string | null = null;
  export let sortColumn: string;
  export let sortDirection: "asc" | "desc";
  export let tokenMap: Map<string, any>;

  let searchTerm = "";
  
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
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return pool.symbol_0.toLowerCase().includes(term) || 
           pool.symbol_1.toLowerCase().includes(term);
  });

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
</script>

<div class="overflow-x-auto rounded-lg bg-white/[0.02] backdrop-blur-sm">
  <div class="p-4 border-b border-[#6ebd40]/20">
    <TextInput
      id="pool-search"
      placeholder="Search by token symbol..."
      value={searchTerm}
      on:input={(e) => searchTerm = e.target.value}
      size="sm"
      variant="success"
    />
  </div>

  {#if loading}
    <div class="flex justify-center items-center h-48">
      <div class="loader" />
    </div>
  {:else if error}
    <div class="text-red-500 text-center p-4">{error}</div>
  {:else}
    <table class="w-full">
      <thead>
        <tr class="bg-[#6ebd40]/10 border-y border-[#6ebd40]/20">
          {#each headers as header}
            <th class="{header.textClass} p-4 font-bold">
              <div class="flex items-center gap-2 justify-{header.textClass === 'text-right' ? 'end' : 'start'}">
                <span class="text-[#6ebd40] font-mono tracking-wide">{header.label}</span>
                {#if header.sortable}
                  <button 
                    class="sort-button" 
                    on:click={() => handleSort(header.column)}
                  >
                    {#if $activeSorts[header.column] === 'asc'}
                      <ArrowUp class="w-4 h-4 text-[#6ebd40]" />
                    {:else if $activeSorts[header.column] === 'desc'}
                      <ArrowDown class="w-4 h-4 text-[#6ebd40]" />
                    {:else}
                      <ArrowUpDown class="w-4 h-4 text-[#6ebd40]/50" />
                    {/if}
                  </button>
                {/if}
              </div>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each filteredPools as pool, i (pool.address_0 + pool.address_1)}
          <PoolRow 
            {pool} 
            {tokenMap}
            isEven={i % 2 === 0}
          />
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .loader {
    @apply w-8 h-8 border-4 border-[#6ebd40]/20 border-t-[#6ebd40] rounded-full animate-spin;
  }

  table {
    border-collapse: separate;
    border-spacing: 0;
  }

  thead {
    @apply sticky top-0 z-10;
  }

  .sort-button {
    @apply p-1 hover:bg-[#6ebd40]/20 rounded transition-colors;
  }
</style> 
