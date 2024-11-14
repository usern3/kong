<!-- src/kong_svelte/src/routes/pools/+page.svelte -->
<script lang="ts">
  import { writable } from "svelte/store";
  import { formatTokenAmount, formatToNonZeroDecimal } from "$lib/utils/numberFormatUtils";
  import TableHeader from "$lib/components/common/TableHeader.svelte";
  import { lpTableHeaders } from "$lib/constants/statsConstants";
  import { filterPools, sortTableData } from "$lib/utils/statsUtils";
  import {
    poolsList,
    poolsLoading,
    poolsError,
  } from "$lib/services/pools/poolStore";
  import { derived } from "svelte/store";
  import { goto } from "$app/navigation";
  import { Droplets, ArrowLeftRight } from "lucide-svelte";
  import { tokenStore } from "$lib/services/tokens/tokenStore";
  import LoadingIndicator from "$lib/components/stats/LoadingIndicator.svelte";
  import { flip } from "svelte/animate";
  import debounce from "lodash-es/debounce";
  import TokenImages from "$lib/components/common/TokenImages.svelte";
  import TabButton from "$lib/components/common/TabButton.svelte";

  const tokenMap = derived(tokenStore, ($tokenStore) => {
    const map = new Map<string, any>();
    $tokenStore.tokens.forEach((token) => {
      map.set(token.canister_id, token);
    });
    return map;
  });

  const searchQuery = writable("");
  const activeTab = writable("all_pools");

  const debouncedSearch = debounce((value: string) => {
    searchQuery.set(value);
  }, 300);

  const sortColumnStore = writable("rolling_24h_volume");
  const sortDirectionStore = writable<"asc" | "desc">("desc");

  const filteredSortedPools = derived(
    [poolsList, searchQuery, sortColumnStore, sortDirectionStore, activeTab],
    ([$pools, $searchQuery, $sortColumn, $sortDirection, $activeTab]) => {
      let filtered = filterPools($pools, $searchQuery);
      if ($activeTab === "your_pools") {
        filtered = filtered.filter(pool => pool.user_lp_balance > 0);
      }
      return sortTableData(filtered, $sortColumn, $sortDirection);
    }
  );

  function handleSortEvent(
    event: CustomEvent<{ column: string; direction: "asc" | "desc" }>,
  ) {
    const { column, direction } = event.detail;
    sortColumnStore.set(column);
    sortDirectionStore.set(direction);
  }
</script>

<section class="flex min-h-[94vh] justify-center w-full">
  <div class="z-10 flex pt-10 justify-center max-w-5xl w-full md:w-100 px-2 md:px-0">
    <div class="flex flex-col w-full">
      <!-- Tabs -->
      <div class="flex gap-2">
        <TabButton
          active={$activeTab === "all_pools"}
          on:click={() => activeTab.set("all_pools")}
        >
          All Pools
        </TabButton>
        <TabButton
          active={$activeTab === "your_pools"}
          on:click={() => activeTab.set("your_pools")}
        >
          Your Pools
        </TabButton>
      </div>

      <div class="inner-border bg-sky-400 bg-opacity-60 backdrop-blur-md border-[5px] border-black p-0.5 w-full mx-auto">
        <div class="p-4 w-full max-h-[68vh] overflow-y-auto pb-8">
          <!-- Header and Search -->
          <div class="flex flex-col md:flex-row items-center mb-2 md:mb-0 pb-2">            
            <div class="flex w-full">
              <h2 class="mt-2 font-black text-3xl text-left text-white mb-4 text-outline-2">
                Liquidity Pools
              </h2>
            </div>
            
            <div class="w-[200px] flex justify-end">
              <input
                type="text"
                placeholder="Search by symbol"
                on:input={(e) => debouncedSearch(e.currentTarget.value)}
                class="w-full bg-sky-200/30 placeholder:text-gray-600 font-alumni text-xl text-black border-none rounded-xl min-w-[160px] focus:ring-green-700 focus:ring-2 p-2.5"
              />
            </div>
          </div>

          <!-- Table -->
          <div class="overflow-x-scroll">
            {#if $poolsLoading}
              <LoadingIndicator />
            {:else if $poolsError}
              <div class="text-center text-red-500 p-4">{$poolsError}</div>
            {:else}
              <table class="w-full text-black font-alumni">
                <!-- Table Headers -->
                <thead>
                  <tr class="border-b-4 border-black text-3xl uppercase">
                    {#each lpTableHeaders as header}
                      <TableHeader
                        {...header}
                        sortColumn={$sortColumnStore}
                        sortDirection={$sortDirectionStore}
                        onsort={handleSortEvent}
                      />
                    {/each}
                  </tr>
                </thead>

                <!-- Table Body -->
                <tbody>
                  {#if !$poolsLoading && $filteredSortedPools.length === 0}
                    <tr class="border-b-2 border-black text-xl md:text-3xl">
                      <td class="p-2 uppercase font-bold text-center" colspan="50">
                        {$activeTab === "your_pools" ? "You have no LP positions" : "No results found"}
                      </td>
                    </tr>
                  {:else}
                    {#each $filteredSortedPools as pool (pool)}
                      <tr
                        class="border-b-2 border-black text-xl md:text-3xl cursor-pointer !h-[4.75rem]"
                        animate:flip={{ duration: 300 }}
                      >
                        <td
                          class="uppercase font-bold pl-2 focused:ring-0 ring-0 focused:border-none active:border-none"
                        >
                          <div class="flex items-center">
                            <TokenImages
                              tokens={[$tokenMap.get(pool.address_0), $tokenMap.get(pool.address_1)]}
                              containerClass="mr-2.5"
                            />
                            <span>{pool.symbol_0}/{pool.symbol_1}</span>
                            {#if pool.is_hot}
                              <span class="flex items-center text-xs">
                                <span class="text-xs mr-0.5">🔥</span> HOT
                              </span>
                            {/if}
                          </div>
                        </td>
                        <td class="p-2 text-right">
                          ${formatToNonZeroDecimal($tokenMap.get(pool.address_0)?.price ?? 0)}
                        </td>
                        <td class="p-2 text-right">
                          ${formatToNonZeroDecimal(pool.tvl)}
                        </td>
                        <td class="p-2 text-right">
                          ${formatToNonZeroDecimal(formatTokenAmount(pool.rolling_24h_volume, 6))}
                        </td>
                        <td class="p-2 text-right">
                          {formatToNonZeroDecimal(pool.rolling_24h_apy)}%
                        </td>
                        <td class="p-2">
                          <div
                            class="flex content-center items-center justify-center gap-x-1"
                          >
                            <button
                              class="rounded-full text-nowrap bg-[#6ebd40] border-2 border-black px-2 py-1 flex items-center justify-center text-xl hover:bg-[#498625] hover:text-white"
                              on:click={() =>
                                goto(
                                  `/pools/add?token0=${pool.address_0}&token1=${pool.address_1}`,
                                )}
                            >
                              <Droplets size={18} class="mr-1" /> Add LP
                            </button>
                            <button
                            on:click={(e) => {
                              e.stopPropagation();
                              if (pool.address_0 && pool.address_1) {
                                goto(`/swap?from=${pool.address_0}&to=${pool.address_1}`);
                              }
                            }}
                            class="rounded-full text-nowrap bg-[#6ebd40] border-2 border-black px-2 py-1 flex items-center justify-center text-xl hover:bg-[#498625] hover:text-white"
                          >
                            <ArrowLeftRight size={18} class="mr-1" /> Swap
                          </button>
                          </div>
                        </td>
                      </tr>
                    {/each}
                  {/if}
                </tbody>
              </table>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .inner-border {
    box-shadow: inset 0 0 0 2px white;
  }

  tr {
    transition: background-color 0.3s ease;
  }

  tbody tr:hover {
    background-image: linear-gradient(
      to right,
      rgba(27, 224, 99, 0.5),
      rgba(255, 225, 0, 0.509)
    );
  }

  tr:focus {
    outline: 2px solid #3b82f6;
    outline-offset: -2px;
  }
</style>
