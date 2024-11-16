<!-- src/kong_svelte/src/routes/earn/+page.svelte -->
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

  const activeSection = writable("pools");
  const activeTab = writable("all_pools");
  const sortColumn = writable("rolling_24h_volume");
  const sortDirection = writable<"asc" | "desc">("desc");

  const filteredPools = derived(
    poolsList,
    ($pools) => $pools
  );
</script>

<style>
  .earn-container {
    display: flex;
    justify-content: center;
    width: 100%;
  }

  .pools-content {
    width: 100%;
    max-width: 1200px;
  }

  .section-selector {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
    position: relative;
    z-index: 10;
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
    <div class="section-selector">
      <Button
        variant="green"
        size="medium"
        state={$activeSection === "pools" ? "selected" : "default"}
        onClick={() => activeSection.set("pools")}
        width="33%"
      >
        Pools
      </Button>
      <Button
        variant="green"
        size="medium"
        state={$activeSection === "staking" ? "selected" : "default"}
        onClick={() => activeSection.set("staking")}
        width="33%"
      >
        Staking
      </Button>
      <Button
        variant="green"
        size="medium"
        state={$activeSection === "lending" ? "selected" : "default"}
        onClick={() => activeSection.set("lending")}
        width="33%"
      >
        Lending
      </Button>
    </div>

    {#if $activeSection === "pools"}
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
    {:else if $activeSection === "staking"}
      <Panel variant="green" width="100%">
        <div class="p-4 text-center text-white">
          Staking coming soon
        </div>
      </Panel>
    {:else if $activeSection === "lending"}
      <Panel variant="green" width="100%">
        <div class="p-4 text-center text-white">
          Lending coming soon
        </div>
      </Panel>
    {/if}
  </div>
</div>
