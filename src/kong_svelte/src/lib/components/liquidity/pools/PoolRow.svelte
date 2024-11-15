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

  export let pool: BE.Pool & { is_hot?: boolean; tvl?: number };
  export let tokenMap: Map<string, any>;
  export let isEven: boolean;
  export let onAddLiquidity: (token0: string, token1: string) => void;

  let showPoolDetails = false;

  function handleAddLiquidity() {
    onAddLiquidity(pool.address_0, pool.address_1);
  }

  function handleSwap() {
    if (pool.address_0 && pool.address_1) {
      goto(`/swap?from=${pool.address_0}&to=${pool.address_1}`);
    }
  }

  $: apyColor =
    pool.rolling_24h_apy > 100
      ? "#FFD700"
      : pool.rolling_24h_apy > 50
        ? "#FFA500"
        : "#FF8C00";
</script>

<tr 
  class="pool-row {isEven ? 'even' : ''}"
  on:click={() => showPoolDetails = true}
>
  <td>
    <div class="token-info">
      <TokenImages
        tokens={[tokenMap.get(pool.address_0), tokenMap.get(pool.address_1)]}
        size={32}
        overlap={12}
      />
      <div>
        <span class="token-pair">{pool.symbol_0}/{pool.symbol_1}</span>
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
      <Button variant="green" size="small" text="Swap" onClick={handleSwap} />
    </div>
  </td>
</tr>

{#if showPoolDetails}
    <PoolDetails {pool} {tokenMap} />
{/if}

<style>
  .pool-row {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    cursor: pointer;
  }

  .pool-row:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .pool-row.even {
    background-color: rgba(255, 255, 255, 0.04);
  }

  .token-info {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
  }

  .token-pair {
    font-size: 1.125rem;
    font-weight: 500;
    color: #ffffff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .hot-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.75rem;
    font-weight: bold;
    color: #ffd700;
    background: rgba(255, 215, 0, 0.1);
    padding: 2px 8px;
    border-radius: 12px;
    width: fit-content;
    margin-top: 4px;
  }

  .value-cell {
    padding: 16px;
    text-align: right;
    font-family: monospace;
    color: #ffffff;
  }

  .apy-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 8px;
    font-weight: bold;
    font-family: monospace;
    color: #000000;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .actions {
    display: flex;
    justify-content: center;
    gap: 8px;
    padding: 16px;
  }
</style>
