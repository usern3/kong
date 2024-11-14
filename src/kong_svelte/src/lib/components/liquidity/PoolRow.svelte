<script lang="ts">
  import { goto } from "$app/navigation";
  import { formatTokenAmount, formatToNonZeroDecimal } from "$lib/utils/numberFormatUtils";
  import TokenImages from "$lib/components/common/TokenImages.svelte";
  import Button from "$lib/components/common/Button.svelte";
  import { Flame } from 'lucide-svelte';

  export let pool: BE.Pool & { is_hot?: boolean; tvl?: number };
  export let tokenMap: Map<string, any>;
  export let isEven: boolean;

  function handleAddLiquidity() {
    goto(`/pools/add?token0=${pool.address_0}&token1=${pool.address_1}`);
  }

  function handleSwap() {
    if (pool.address_0 && pool.address_1) {
      goto(`/swap?from=${pool.address_0}&to=${pool.address_1}`);
    }
  }

  $: apyColor = pool.rolling_24h_apy > 100 ? 'bg-yellow-400' : 
                pool.rolling_24h_apy > 50 ? 'bg-yellow-500' : 'bg-yellow-600';
</script>

<tr class="border-b border-[#6ebd40]/10 hover:bg-[#6ebd40]/10 transition-colors duration-200 {isEven ? 'bg-[#6ebd40]/[0.03]' : 'bg-transparent'}">
  <td class="py-4 pl-4">
    <div class="flex items-center gap-3">
      <TokenImages
        tokens={[tokenMap.get(pool.address_0), tokenMap.get(pool.address_1)]}
        size={32}
        overlap={12}
      />
      <div class="flex flex-col">
        <span class="text-lg font-medium text-white">{pool.symbol_0}/{pool.symbol_1}</span>
        {#if pool.is_hot}
          <span class="text-xs bg-[#6ebd40]/10 text-[#6ebd40] px-2 py-0.5 rounded-full flex items-center gap-1 font-bold w-fit">
            <Flame class="w-3 h-3" /> HOT POOL
          </span>
        {/if}
      </div>
    </div>
  </td>
  <td class="py-4 px-4 text-right font-mono text-white">
    ${formatToNonZeroDecimal(tokenMap.get(pool.address_0)?.price ?? 0)}
  </td>
  <td class="py-4 px-4 text-right font-mono text-white">
    ${formatToNonZeroDecimal(pool.tvl)}
  </td>
  <td class="py-4 px-4 text-right font-mono text-white">
    ${formatToNonZeroDecimal(pool.rolling_24h_volume.toString())}
  </td>
  <td class="py-4 px-4 text-right">
    <div class="flex justify-end">
      <span class="{apyColor} px-2 py-1 rounded-lg font-mono font-bold text-black shadow-sm">
        {formatToNonZeroDecimal(pool.rolling_24h_apy)}%
      </span>
    </div>
  </td>
  <td class="py-4 pr-4">
    <div class="flex justify-center gap-2">
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
    </div>
  </td>
</tr> 
