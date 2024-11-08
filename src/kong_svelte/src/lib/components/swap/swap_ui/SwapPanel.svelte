<!-- Description: This is the SwapPanel component that displays the swap input fields and token selector. -->
<script lang="ts">
  import Panel from "$lib/components/common/Panel.svelte";
  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";
  import { tokenStore, formattedTokens } from "$lib/features/tokens/tokenStore";
  import { formatTokenAmount } from "$lib/utils/numberFormatUtils";
  import { toastStore } from "$lib/stores/toastStore";
  import TokenImages from "$lib/components/common/TokenImages.svelte";
  
  export let title: string;
  export let token: string;
  export let amount: string = "0";
  export let onTokenSelect: () => void;
  export let onAmountChange: (event: Event) => void;
  export let disabled = false;
  export let showPrice = false;
  export let slippage = 0;

  // Get token info and formatted values
  $: tokenInfo = $formattedTokens.find(t => t.symbol === token);
  $: decimals = tokenInfo?.decimals || 8;
  $: formattedBalance = formatTokenAmount($tokenStore.balances[tokenInfo?.canister_id]?.in_tokens || "0", decimals).toString();
  $: formattedUsdValue = tokenInfo?.price?.toString() || "0";
  $: console.log("tokenInfo", tokenInfo);

  // Calculate USD value for current amount
  $: calculatedUsdValue = (parseFloat(amount || "0") * parseFloat(formattedUsdValue)).toFixed(2);
  $: isOverBalance = parseFloat(amount || "0") > parseFloat(formattedBalance || "0");

  const animatedUsdValue = tweened(0, {
    duration: 400,
    easing: cubicOut,
  });

  const animatedAmount = tweened(0, {
    duration: 400,
    easing: cubicOut,
  });

  const animatedSlippage = tweened(0, {
    duration: 400,
    easing: cubicOut
  });

  // Update animated values
  $: {
    animatedUsdValue.set(parseFloat(calculatedUsdValue));
    animatedAmount.set(parseFloat(amount || "0"));
    animatedSlippage.set(slippage);
  }

  let inputFocused = false;
  let isAnimating = false;
  let inputElement: HTMLInputElement;

  function handleMaxClick() {
    if (!disabled && title === "You Pay") {
      try {
        const maxAmount = BigInt($tokenStore.balances[tokenInfo?.canister_id]?.in_tokens || 0) - BigInt(tokenInfo?.fee || 0);
        const formattedMaxAmount = formatTokenAmount(maxAmount.toString(), decimals);
        isAnimating = true;

        const event = new CustomEvent('input', {
          bubbles: true,
          detail: { value: formattedMaxAmount.toString() }
        });
        onAmountChange(event);

        animatedAmount.set(parseFloat(formattedMaxAmount.toString()), {
          duration: 400,
          easing: cubicOut
        }).then(() => {
          isAnimating = false;
          if (inputElement) {
            inputElement.value = formattedMaxAmount.toString();
          }
        });
      } catch (error) {
        console.error("Error in handleMaxClick:", error);
      }
    }
  }

  function handleInput(event: Event) {
    if (title === "You Receive") return;
    
    try {
      const input = event.target as HTMLInputElement;
      const newValue = input.value;
      
      isAnimating = false;
      onAmountChange(event);
      animatedAmount.set(parseFloat(newValue || "0"), { duration: 0 });
    } catch (error) {
      console.error("Error in handleInput:", error);
      toastStore.error("Invalid input amount");
    }
  }
</script>

<svelte:head>
  <link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet">
</svelte:head>

<Panel variant="green" type="main" className="token-panel">
  <div class="panel-inner">
    <header class="panel-header">
      <div class="title-container">
        <h2 class="panel-title">{title}</h2>
        {#if showPrice && $animatedSlippage > 0}
          <div class="slippage-display" title="Price Slippage">
            <span class="slippage-value" class:high={$animatedSlippage >= 10}>
              {$animatedSlippage.toFixed(2)}%
            </span>
          </div>
        {/if}
      </div>
    </header>

    <div class="input-section">
      <div class="amount-container">
        <div class="token-logo">
          <TokenImages
            tokens={[tokenInfo]}
            containerClass="mr-1"
          />
        </div>
        <input
          bind:this={inputElement}
          type="text"
          class="amount-input"
          class:error={isOverBalance && title === "You Pay"}
          value={isAnimating ? $animatedAmount.toFixed(decimals) : amount}
          on:input={handleInput}
          on:focus={() => inputFocused = true}
          on:blur={() => inputFocused = false}
          placeholder="0"
          disabled={disabled || title === "You Receive"}
          readonly={title === "You Receive"}
        />
        {#if title === "You Pay"}
          <button class="max-button hide-mobile" on:click={handleMaxClick}>MAX</button>
        {:else}
          <button class="max-button disabled-max hide-mobile" disabled>MAX</button>
        {/if}
        <div class="token-selector">
          <button
            class="token-button"
            on:click={onTokenSelect}
            type="button"
          >
            <span class="token-text">{token}</span>
            <span class="chevron">▼</span>
          </button>
        </div>
      </div>
    </div>

    <footer class="balance-display">
      <div class="balance-info">
        <span class="balance-label">Available</span>
        <div class="balance-values">
          <span class="token-amount">{formattedBalance} {token}</span>
          <span class="separator">|</span>
          <span class="fiat-amount">
            ${$animatedUsdValue}
          </span>
        </div>
      </div>
    </footer>
  </div>
</Panel>

<style lang="postcss">
:root {
  --panel-bg: rgba(0, 0, 0, 0.75);
  --panel-border: rgba(100, 255, 100, 0.3);
  --input-bg: rgba(0, 0, 0, 0.5);
  --input-border: rgba(100, 255, 100, 0.2);
  --font-family: 'Alumni Sans', system-ui, -apple-system, sans-serif;
  --font-pixel: 'Press Start 2P', monospace;
}

/* Base styles */
* {
  font-family: var(--font-family);
}

/* Panel Layout */
.panel-inner {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.5rem;
  min-height: 165px;
}

.panel-header {
  padding: 0.25rem;
}

.title-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.panel-title {
  font-size: 2.5rem;
  font-weight: 600;
  color: #fff;
  margin: 0;
  font-family: var(--font-family);
  letter-spacing: 0.02em;
}

.input-section {
  flex: 1;
}

.amount-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.amount-input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 2rem;
  font-weight: 500;
  font-family: var(--font-family);
  padding: 0.25rem;
}

.amount-input:focus {
  outline: none;
}

/* Scanline effect */
.panel-content::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(100, 255, 100, 0.03) 0px,
    rgba(100, 255, 100, 0.03) 1px,
    transparent 1px,
    transparent 2px
  );
  pointer-events: none;
  opacity: 0.5;
}

/* Header Styles */
.title-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem;
  gap: 1rem;
  min-height: 2.5rem;
}

.panel-title {
  font-size: 2.5rem;
  font-weight: 600;
  color: #00ff00;
  text-shadow: 
    0 0 5px rgba(0, 255, 0, 0.5),
    0 0 10px rgba(0, 255, 0, 0.3);
  margin: 0;
  font-family: var(--font-family);
  letter-spacing: 0.05em;
}

/* Settings Button */
.settings-button {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  opacity: 0.7;
  transition: all var(--transition-fast);
}

.settings-button:hover {
  opacity: 1;
  transform: rotate(45deg);
}

.settings-icon {
  font-size: 1.25rem;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.5));
}

/* Input Section */
.input-section {
  position: relative;
  flex-grow: 1;
  margin-bottom: -1px;
  height: 68px;
}
.token-selector {
  display: flex;
  align-items: center;
}

.token-button {
  background: var(--input-bg);
  border: 2px solid var(--input-border);
  border-radius: 4px;
  padding: 0.5rem 1rem;
  color: #00ff00;
  font-family: var(--font-family);
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s ease;
  min-width: 100px;
  text-shadow: 0 0 5px rgba(0, 255, 0, 0.5);
}

.token-button:hover:not(:disabled) {
  background: rgba(0, 255, 0, 0.1);
  border-color: rgba(100, 255, 100, 0.4);
  box-shadow: 
    0 0 10px rgba(0, 255, 0, 0.2),
    inset 0 0 5px rgba(0, 255, 0, 0.2);
}

.token-button.warning {
  background: var(--color-warning-alpha-10);
  border: 2px solid var(--color-warning-alpha-30);
  box-shadow: 
    0 0 0 1px rgba(0, 0, 0, 0.2),
    0 2px 4px rgba(0, 0, 0, 0.1);
}

.token-text {
  margin-right: 0.25rem;
  font-size: 1.4rem;
}

.chevron {
  font-size: 0.6rem;
  opacity: 0.6;
  transition: transform var(--transition-normal);
  margin-left: auto;
}

.token-button:hover .chevron {
  transform: translateY(1px);
}

/* Max Button */
.max-button {
  background: rgba(0, 255, 0, 0.1);
  border: 2px solid rgba(0, 255, 0, 0.3);
  color: #00ff00;
  font-family: var(--font-pixel);
  font-size: 0.7rem;
  padding: 0.25rem 0.5rem;
  border-radius: 2px;
  transition: all 0.2s ease;
  text-shadow: 0 0 5px rgba(0, 255, 0, 0.5);
}

.max-button:hover:not(:disabled) {
  background: rgba(0, 255, 0, 0.2);
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
}

.max-button.disabled-max {
  background: var(--color-white-alpha-10);
  border: 1px solid var(--color-white-alpha-20);
  color: var(--color-white-alpha-20);
  cursor: not-allowed;
  opacity: 0.5;
}

.max-button.disabled-max:hover {
  transform: none;
  box-shadow: none;
}
.amount-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--input-bg);
  border: 2px solid var(--input-border);
  border-radius: 4px;
  margin: 0.5rem 0;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
}

/* Input Styles */
.amount-input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  color: #00ff00;
  font-size: 2rem;
  font-weight: 500;
  font-family: var(--font-family);
  text-shadow: 0 0 5px rgba(0, 255, 0, 0.5);
}

.amount-input:focus {
  outline: none;
}

.amount-input::placeholder {
  color: rgba(0, 255, 0, 0.3);
}

/* Token Button */
.token-button {
  background: var(--color-black-alpha-25);
  border: 1px solid var(--color-white-alpha-10);
  border-radius: var(--border-radius-medium);
  padding: 0.1rem 0.25rem;
  color: var(--color-white);
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all var(--transition-fast);
  cursor: pointer;
  min-width: 85px;
  height: 42px;
  box-sizing: border-box;
}

.token-button:hover:not(:disabled) {
  background: var(--color-black-alpha-45);
  border-color: rgba(100, 173, 59, 0.8);
  transform: translateY(-1px);
}

/* Token Display */
.token-logo {
  display: flex;
  align-items: center;
}

/* Balance Display */
.balance-display {
  background: var(--color-black-alpha-25);
  border: 1px solid var(--border-success);
  border-top: none;
  border-radius: 0 0 var(--border-radius-medium) var(--border-radius-medium);
  padding: 0.75rem 0.5rem;
  color: var(--color-white);
  font-family: var(--font-family);
  font-size: 1.2rem;
}

.balance-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.balance-values {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.balance-label {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.token-amount {
  font-weight: 600;
  font-size: 1.3rem;
}

.separator {
  color: rgba(255, 255, 255, 0.1);
}

.fiat-amount {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.2rem;
}

.network-fee {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-white-alpha-10);
  font-size: 0.9rem;
  color: var(--color-white-alpha-20);
}


/* Warning States */
.warning {
  border: 2px solid var(--color-warning-alpha-30);
  background: var(--color-warning-alpha-05);
  box-shadow: 
    0 0 0 1px rgba(0, 0, 0, 0.2),
    0 2px 4px rgba(0, 0, 0, 0.1);
  animation: pulse-warning 2s infinite;
}

/* Animations */
@keyframes pulse-warning {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.balance-label, .fee-label {
  color: #FFD700;
  font-weight: 500;
}

.token-amount, .fee-amount {
  color: #FFFFFF;
  font-weight: 600;
}

.network-fee {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-white-alpha-10);
}

.slippage-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all var(--transition-fast);
}

.slippage-icon {
  font-size: 1.25rem;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.5));
}

.slippage-value {
  font-size: 2.25rem;
  font-weight: 600;
  color: #FFB74D;
  text-shadow: var(--shadow-text);
  transition: color 0.2s ease;
}

.slippage-value.high {
  color: var(--color-warning);
  animation: pulse-warning 2s infinite;
}

/* Add styles for the USD fee display */
.fee-usd {
  font-size: 0.85em;
  opacity: 0.7;
  margin-left: 0.5rem;
}

/* Add a subtle glow effect when value changes */
.fiat-amount:not(:hover) {
  animation: value-update 0.4s ease-out;
}

@keyframes value-update {
  0% {
    opacity: 0.7;
    transform: scale(0.95);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 768px) {
  .panel-content {
    padding: 0.75rem;
  }

  .panel-title {
    font-size: 2rem;
  }

  .amount-input {
    font-size: 1.75rem;
  }

  .token-button {
    font-size: 1.25rem;
    padding: 0.4rem 0.8rem;
  }
}

.amount-input.error {
  color: #ff3d00;
  text-shadow: 0 0 5px rgba(255, 61, 0, 0.5);
}

/* Mobile Optimizations */
@media (max-width: 768px) {
  .panel-content {
    padding: 0.5rem;
  }

  .panel-inner {
    gap: 0.5rem;
    padding: 0.25rem;
    min-height: 140px;
  }

  .panel-title {
    font-size: 1.75rem;
  }

  .amount-container {
    padding: 0.5rem;
    gap: 0.25rem;
  }

  .amount-input {
    font-size: 1.5rem;
    padding: 0.15rem;
  }

  .token-button {
    font-size: 1.1rem;
    padding: 0.3rem 0.6rem;
    min-width: 70px;
    height: 36px;
  }

  .token-text {
    font-size: 1.1rem;
  }

  .balance-display {
    padding: 0.5rem 0.25rem;
    font-size: 1rem;
  }

  .token-amount {
    font-size: 1.1rem;
  }

  .fiat-amount {
    font-size: 1rem;
  }

  .slippage-value {
    font-size: 1.75rem;
  }

  /* Hide MAX button on mobile */
  .hide-mobile {
    display: none;
  }

  /* Adjust token logo size */
  .token-logo :global(img) {
    width: 24px;
    height: 24px;
  }
}

/* Even smaller screens */
@media (max-width: 400px) {
  .panel-title {
    font-size: 1.5rem;
  }

  .panel-inner {
    gap: 0.25rem;
    padding: 0.15rem;
    min-height: 130px;
  }

  .amount-container {
    padding: 0.35rem;
    gap: 0.15rem;
    margin: 0.25rem 0;
  }

  .amount-input {
    font-size: 1.25rem;
    padding: 0.1rem;
  }

  .token-button {
    min-width: 60px;
    font-size: 1rem;
    padding: 0.25rem 0.5rem;
    height: 32px;
  }

  .balance-values {
    gap: 0.35rem;
  }

  .balance-display {
    padding: 0.35rem 0.25rem;
  }

  .token-amount {
    font-size: 1rem;
  }

  .fiat-amount {
    font-size: 0.9rem;
  }

  .slippage-value {
    font-size: 1.5rem;
  }
}

</style>
