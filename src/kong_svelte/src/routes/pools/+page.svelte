<!-- src/kong_svelte/src/routes/pools/+page.svelte -->
<script lang="ts">
  import { writable } from "svelte/store";
  import { poolsList, poolsLoading, poolsError } from "$lib/services/pools/poolStore";
  import { tokenStore } from "$lib/services/tokens/tokenStore";
  import { derived } from "svelte/store";
  import PoolsTable from "$lib/components/liquidity/pools/PoolsTable.svelte";
  import Button from "$lib/components/common/Button.svelte";
  import Panel from "$lib/components/common/Panel.svelte";

  const tokenMap = derived(tokenStore, ($tokenStore) => {
    const map = new Map<string, any>();
    $tokenStore.tokens.forEach((token) => {
      map.set(token.canister_id, token);
    });
    return map;
  });

  const activeTab = writable("all_pools");
  const sortColumn = writable("rolling_24h_volume");
  const sortDirection = writable<"asc" | "desc">("desc");

  const filteredPools = derived(
    [poolsList, activeTab],
    ([$pools, $activeTab]) => {
      if ($activeTab === "your_pools") {
        return $pools.filter(pool => pool.user_lp_balance > 0);
      }
      return $pools;
    }
  );
</script>

<style>
  .pools-container {
    display: flex;
    justify-content: center;
    width: 100%;
  }

  .pools-content {
    width: 100%;
    max-width: 1200px;
  }

  .mode-selector {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    position: relative;
    z-index: 10;
  }

  @media (max-width: 768px) {
    .pools-container {
      padding: 12px;
    }
  }

  @media (min-width: 769px) {
    .pools-container {
      padding: 24px;
    }
  }
</style>

<div class="pools-container">
  <div class="pools-content">
    <div class="mode-selector">
      <Button
        variant="yellow"
        size="medium"
        state={$activeTab === "all_pools" ? "selected" : "default"}
        onClick={() => activeTab.set("all_pools")}
        width="50%"
      >
        All Pools
      </Button>
      <Button
        variant="yellow"
        size="medium"
        state={$activeTab === "your_pools" ? "selected" : "default"}
        onClick={() => activeTab.set("your_pools")}
        width="50%"
      >
        Your Pools
      </Button>
    </div>

    <Panel variant="green" width="100%">
      <PoolsTable
        pools={$filteredPools}
        loading={$poolsLoading}
        error={$poolsError}
        sortColumn={$sortColumn}
        sortDirection={$sortDirection}
        tokenMap={$tokenMap}
      />
    </Panel>
  </div>
</div>
