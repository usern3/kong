<script lang="ts">
  export let active = false;
</script>

<button
  class="px-6 py-2 text-2xl font-alumni border-2 border-black {
    active
      ? 'bg-sky-400 bg-opacity-60 backdrop-blur-md text-white border-b-0 rounded-t-xl'
      : 'bg-gray-200 hover:bg-gray-300 rounded-xl'
  }"
  on:click
>
  <div class="flex items-center justify-center gap-2">
    <slot />
  </div>
</button>

<style>
  button {
    transition: all 0.2s ease;
    min-width: 140px;
  }

  button:not(.active):hover {
    transform: translateY(-1px);
  }
</style> 
