<script lang="ts">
  export let variant: "green" | "yellow" | "blue" = "green";
  export let disabled: boolean = false;
  export let type: "button" | "submit" | "reset" = "button";
  export let className: string = "";
</script>

<button
  {type}
  {disabled}
  class="button {variant} {className}"
  on:click
>
  <slot />
</button>

<style lang="postcss">
  .button {
    position: relative;
    padding: 8px 16px;
    font-size: 14px;
    border: 4px solid var(--jungle-light);
    background: var(--jungle-dark);
    color: var(--jungle-light);
    cursor: pointer;
    letter-spacing: 0.5px;
    min-width: 100px;
    text-align: center;
    image-rendering: pixelated;
    box-shadow: 4px 4px 0 #000;
    transition: all 0.1s steps(1);
    text-transform: uppercase;
    font-family: 'Press Start 2P', monospace;
  }

  .button:hover:not(:disabled) {
    filter: brightness(120%);
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0 #000;
  }

  .button:active:not(:disabled) {
    transform: translate(4px, 4px);
    box-shadow: 0 0 0 #000;
  }

  .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    filter: grayscale(100%);
  }

  .button.yellow {
    border-color: var(--moonlight);
    background: #000;
    color: var(--moonlight);
  }

  .button.blue {
    border-color: var(--path);
    background: #000;
    color: var(--path);
  }

  @media (max-width: 768px) {
    .button {
      padding: 6px 12px;
      font-size: 12px;
      min-width: 80px;
      border-width: 3px;
      box-shadow: 3px 3px 0 #000;
    }

    .button:hover:not(:disabled) {
      transform: translate(-1px, -1px);
      box-shadow: 4px 4px 0 #000;
    }

    .button:active:not(:disabled) {
      transform: translate(3px, 3px);
      box-shadow: 0 0 0 #000;
    }
  }
</style>
