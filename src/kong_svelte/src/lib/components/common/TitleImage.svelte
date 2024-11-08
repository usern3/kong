<script lang="ts">
    export let img: 'swap' | 'stats' | 'pools' | 'logo' | 'coming_soon';
    export let className = '';
  
    const imageMap = {
      swap: 'titles/swap_title.webp',
      stats: 'titles/stats_title.webp',
      pools: 'titles/pools_title.webp',
      logo: 'titles/logo-king-kong.svg',
      coming_soon: 'titles/coming_soon.png'
    };
</script>
  
<div class="title-wrapper {className}">
  <img 
    src={imageMap[img]} 
    alt={`${img} title`}
    class="title-image"
  />
</div>
  
<style lang="postcss">
  .title-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 0 1rem;
    box-sizing: border-box;
    margin-bottom: 1rem;
  }

  .title-image {
    width: 100%;
    max-width: 420px;
    height: auto;
    object-fit: contain;
    image-rendering: pixelated;
  }

  @media (max-width: 768px) {
    .title-wrapper {
      padding: 0 0.5rem;
    }

    .title-image {
      max-width: 320px;
    }
  }

  @media (max-width: 480px) {
    .title-image {
      max-width: 280px;
    }
  }
</style>
