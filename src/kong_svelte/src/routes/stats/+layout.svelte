<script lang="ts">
  import Clouds from "$lib/components/stats/Clouds.svelte";
  import { onMount } from "svelte";
  import { t } from "$lib/locales/translations";
  import { restoreWalletConnection } from "$lib/stores/walletStore";
  import Navbar from "$lib/components/nav/Navbar.svelte";
  import { currentEnvMode } from "$lib/utils/envUtils";
  import { switchLocale } from "$lib/stores/localeStore";

  onMount(async () => {
    switchLocale("en");
    Promise.all([restoreWalletConnection()]);
  });
</script>


<svelte:head>
  <title>
    {currentEnvMode() ? `[${currentEnvMode()}] KongSwap` : `KongSwap`} - {$t(
      "common.browserSubtitle",
    )}
  </title>
</svelte:head>

<div class="flex justify-center">
  <Navbar />
</div>

<Clouds />

<main class="flex min-h-[95vh] bg-sky-100 relative pt-28">
  <slot />
</main>

<div
  style="background-image:url('/backgrounds/grass.webp'); background-repeat: repeat-x; background-size: 100% 100%; z-index: 1000;"
  class="w-full min-h-[80px] max-h-[80px]"
/>

<style>
  main {
    background-color: #5bb2cf;
    background-size: cover;
    background-position: center;
  }
</style>