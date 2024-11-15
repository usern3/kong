<script lang="ts">
  import { goto } from "$app/navigation";
  import {
    formatTokenAmount,
    formatToNonZeroDecimal,
  } from "$lib/utils/numberFormatUtils";
  import TokenImages from "$lib/components/common/TokenImages.svelte";
  import Button from "$lib/components/common/Button.svelte";
  import Modal from "$lib/components/common/Modal.svelte";
  import PoolDetails from "$lib/components/liquidity/pools/PoolDetails.svelte";
  import { Flame } from "lucide-svelte";
  import AddLiquidityModal from "$lib/components/liquidity/add_liquidity/AddLiquidityModal.svelte";
  import { onMount } from 'svelte';

  export let pool: BE.Pool & { is_hot?: boolean; tvl?: number };
  export let tokenMap: Map<string, any>;
  export let isEven: boolean;
  export let onAddLiquidity: (token0: string, token1: string) => void;

  let showPoolDetails = false;
  let showAddLiquidity = false;
  let isMobile = false;

  onMount(() => {
    const checkMobile = () => {
      isMobile = window.innerWidth < 768;
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  });

  function handleAddLiquidity() {
    showAddLiquidity = true;
  }

  function handleAddLiquidityClose() {
    showAddLiquidity = false;
  }

  function handleSwap() {
    if (pool.address_0 && pool.address_1) {
      goto(`/swap?from=${pool.address_0}&to=${pool.address_1}`);
    }
  }

  function handleClose() {
    showPoolDetails = false;
  }

  function handleViewDetails() {
    showPoolDetails = true;
  }

  $: apyColor =
    pool.rolling_24h_apy > 100
      ? "#FFD700"
      : pool.rolling_24h_apy > 50
        ? "#FFA500"
        : "#FF8C00";
</script>

{#if !isMobile}
  <!-- Desktop view (table row) -->
  <tr class="pool-row {isEven ? 'even' : ''}">
    <td class="w-[44px] pl-3.5">
      <div class="token-info">
        <TokenImages
          tokens={[tokenMap.get(pool.address_0), tokenMap.get(pool.address_1)]}
          size={40}
          overlap={16}
        />
        <div class="flex flex-col">
          <span class="token-pair text-lg font-bold">{pool.symbol_0}/{pool.symbol_1}</span>
          {#if pool.is_hot}
            <div class="hot-badge">
              <Flame class="w-3 h-3" /> HOT POOL
            </div>
          {/if}
        </div>
      </div>
    </td>
    <td class="value-cell">
      ${formatToNonZeroDecimal(tokenMap.get(pool.address_0)?.price ?? 0)}
    </td>
    <td class="value-cell">
      ${formatToNonZeroDecimal(pool.tvl)}
    </td>
    <td class="value-cell">
      ${formatToNonZeroDecimal(pool.rolling_24h_volume.toString())}
    </td>
    <td class="value-cell">
      <div style="display: flex; justify-content: flex-end;">
        <span class="apy-badge" style="background-color: {apyColor}">
          {formatToNonZeroDecimal(pool.rolling_24h_apy)}%
        </span>
      </div>
    </td>
    <td>
      <div class="actions">
        <Button
          variant="green"
          size="small"
          text="Add LP"
          onClick={handleAddLiquidity}
        />
        <Button 
          variant="green" 
          size="small" 
          text="Swap" 
          onClick={handleSwap}
        />
        <Button 
          variant="green"
          size="small" 
          text="Details" 
          onClick={handleViewDetails}
        />
      </div>
    </td>
  </tr>
{:else}
  <!-- Mobile view (card) -->
  <div class="mobile-pool-card">
    <div class="card-header">
      <div class="token-info">
        <TokenImages
          tokens={[tokenMap.get(pool.address_0), tokenMap.get(pool.address_1)]}
          size={48}
          overlap={20}
        />
        <div class="token-info-text">
          <span class="token-pair text-2xl">{pool.symbol_0}/{pool.symbol_1}</span>
          {#if pool.is_hot}
            <div class="hot-badge">
              <Flame class="w-3 h-3" /> HOT POOL
            </div>
          {/if}
        </div>
      </div>
    </div>

    <div class="card-stats">
      <div class="stat-row">
        <div class="stat-item">
          <span class="stat-label">Price</span>
          <span class="stat-value">${formatToNonZeroDecimal(tokenMap.get(pool.address_0)?.price ?? 0)}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">TVL</span>
          <span class="stat-value">${formatToNonZeroDecimal(pool.tvl)}</span>
        </div>
      </div>
      
      <div class="stat-row">
        <div class="stat-item">
          <span class="stat-label">Volume (24h)</span>
          <span class="stat-value">${formatToNonZeroDecimal(pool.rolling_24h_volume.toString())}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">APY</span>
          <span class="apy-badge" style="background-color: {apyColor}">
            {formatToNonZeroDecimal(pool.rolling_24h_apy)}%
          </span>
        </div>
      </div>
    </div>

    <div class="card-actions">
      <Button
        variant="green"
        size="small"
        text="Add LP"
        onClick={handleAddLiquidity}
        class="action-button"
      />
      <Button 
        variant="green" 
        size="small" 
        text="Swap" 
        onClick={handleSwap}
        class="action-button"
      />
      <Button 
        variant="green"
        size="small" 
        text="Details" 
        onClick={handleViewDetails}
        class="action-button"
      />
    </div>
  </div>
{/if}

{#if showAddLiquidity}
  <AddLiquidityModal
    showModal={showAddLiquidity}
    onClose={handleAddLiquidityClose}
    token0={tokenMap.get(pool.address_0)}
    token1={tokenMap.get(pool.address_1)}
  />
{/if}

{#if showPoolDetails}
  <PoolDetails 
    showModal={showPoolDetails} 
    onClose={handleClose}
    {pool}
    {tokenMap}
  />
{/if}

<style lang="postcss">
  .pool-row {
    @apply border-b border-emerald-900/30 transition-colors duration-150;
  }

  .pool-row:hover {
    @apply bg-emerald-800/10;
  }

  .pool-row.even {
    @apply bg-emerald-900/30;
  }

  .mobile-pool-card {
    @apply bg-emerald-900/20 rounded-xl flex flex-col border border-emerald-900/30 shadow-lg mb-4;
  }

  .card-header {
    @apply p-6 border-b border-emerald-900/30 bg-emerald-900/10;
  }

  .token-info {
    @apply flex items-center gap-4;
  }

  .token-info-text {
    @apply flex flex-col items-center;
  }

  .token-pair {
    @apply text-xl font-semibold text-white text-center;
  }

  .card-stats {
    @apply flex flex-col gap-4 p-4 border-b border-emerald-900/30;
  }

  .stat-row {
    @apply grid grid-cols-2 gap-4;
  }

  .stat-item {
    @apply flex flex-col items-center text-center;
  }

  .stat-label {
    @apply text-sm text-emerald-300/70 font-medium mb-1;
  }

  .stat-value {
    @apply text-white font-bold font-mono text-lg;
  }

  .card-actions {
    @apply grid grid-cols-3 gap-3 p-6;
  }

  .action-button {
    @apply w-full shadow-sm;
  }

  .hot-badge {
    @apply flex items-center gap-1 text-xs font-bold text-yellow-300 bg-yellow-400/20 
           px-2 py-1 rounded-full mt-1 shadow-sm;
  }

  .apy-badge {
    @apply px-4 py-1.5 rounded-lg font-bold font-mono text-black text-sm shadow-sm;
  }

  .value-cell {
    @apply px-6 py-4 text-right font-mono text-white font-medium;
  }

  .actions {
    @apply flex justify-center gap-2 p-4;
  }
</style>
