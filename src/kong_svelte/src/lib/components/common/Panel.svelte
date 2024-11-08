<!-- Panel.svelte -->
<script lang="ts">
  import { browser } from "$app/environment";

  export let variant: "green" | "yellow" | "blue" = "green";
  export let type: "main" | "secondary" = "main"; 
  export let width: string = "auto";
  export let height: string = "auto";
  export let content: string = '';
  export let className: string = '';
  export let zIndex: number = 1000;

  function formatDimension(value: number | string): string {
    return value === 'auto' ? 'auto' : typeof value === 'number' ? `${value}px` : value;
  }

  $: formattedWidth = formatDimension(width);
  $: formattedHeight = formatDimension(height);
  $: isAutoSize = width === 'auto' || height === 'auto';

  $: if(browser) {
    document.getElementById('panel')?.style.setProperty('z-index', zIndex.toString());
  }
</script>

<div 
  class="panel {variant} {type} {className}"
  style="width: {formattedWidth}; height: {formattedHeight};"
>
  <div class="panel-container" class:auto-size={isAutoSize}>
    <div class="panel-content">
      <slot>{content}</slot>
    </div>
  </div>
</div>

<style lang="postcss">
  .panel {
    position: relative;
    padding: 8px 16px;
    background: var(--jungle-dark);
    color: var(--jungle-light);
    border: 4px solid var(--jungle-light);
    font-family: 'Press Start 2P', monospace;
    font-size: 14px;
    text-transform: uppercase;
    cursor: pointer;
    box-shadow: 4px 4px 0 #000,
                3px 3px 0 var(--jungle-light);
    image-rendering: pixelated;
  }

  .panel.yellow {
    background: #000;
    color: var(--moonlight);
    border-color: var(--moonlight);
    box-shadow: 4px 4px 0 #000,
                3px 3px 0 var(--moonlight);
  }

  .panel.blue {
    background: #000;
    color: var(--path);
    border-color: var(--path);
    box-shadow: 4px 4px 0 #000,
                3px 3px 0 var(--path);
  }

  .panel-container {
    width: 100%;
    height: 100%;
  }

  .panel-content {
    display: flex;
    flex-direction: column;
    letter-spacing: 0.5px;
  }

  @media (max-width: 768px) {
    .panel {
      padding: 6px 12px;
      font-size: 12px;
      border-width: 3px;
      box-shadow: 3px 3px 0 #000,
                  2px 2px 0 var(--jungle-light);
    }

    .panel.yellow {
      box-shadow: 3px 3px 0 #000,
                  2px 2px 0 var(--moonlight);
    }

    .panel.blue {
      box-shadow: 3px 3px 0 #000,
                  2px 2px 0 var(--path);
    }
  }

  :root {
    --jungle-green: #1f6b3f;
    --jungle-light: #98ff98;
    --jungle-dark: #0a1810;
    --moonlight: #93cfff;
    --path: #ffd700;
  }
</style>
