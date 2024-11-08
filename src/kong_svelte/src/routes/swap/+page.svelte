<script lang="ts">
  import Swap from "$lib/components/swap/Swap.svelte";
  import kongImage from "$lib/assets/kong/kong.png";
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import TitleImage from "$lib/components/common/TitleImage.svelte";

  const SIDEBAR_WIDTH = 240;
  let isFlipped = false;
  let position = SIDEBAR_WIDTH;
  let verticalPosition = 0;
  let isJumping = false;
  let scale = 1;
  let showSpeech = false;
  let speechText = "";
  let isMobile = false;

  // Add breathing animation variables
  let breathScale = 1;

  const speeches = [
    "ME ANGRY AT BITCOIN MAXIS! 😠",
    "ICP MAKE KONG STRONG! 💪",
    "WHO DARE CHALLENGE KONG'S DIAMOND HANDS! 💎",
    "ME SMASH CENTRALIZED EXCHANGES! 💥",
    "KONG STACK MORE ICP! 🚀",
    "GRRRR... ME HATE ETHEREUM GAS FEES! ⛽",
    "KONG GUARD INTERNET COMPUTER! 🦍",
    "ME NO LIKE PAPER HANDS! 📄",
    "KONG HODL FOREVER! 💎",
    "DFINITY MAKE GOOD BANANA! 🍌",
    "ME GRUMPY TODAY... BUY DIP! 📉"
  ];

  const greetings = [
    "OOGA BOOGA! ME HERE TO HELP! 🦍",
    "RAAAWR! KONG READY TO SWAP! 💪",
    "OOOH OOH AH AH! WELCOME! 🍌",
    "KONG HAPPY TO SEE YOU! 😊"
  ];

  function checkScreenSize() {
    isMobile = window.innerWidth <= 768;
    updatePosition();
  }

  function updatePosition() {
    const minX = isMobile ? 20 : SIDEBAR_WIDTH;
    const maxX = window.innerWidth - (isMobile ? 200 : 400);
    position = isFlipped ? maxX : minX;
  }

  function getRandomSpeech() {
    return speeches[Math.floor(Math.random() * speeches.length)];
  }

  function showSpeechBubble(text: string) {
    // Only show speech bubbles if not on mobile
    if (!isMobile) {
      speechText = text;
      showSpeech = true;
      setTimeout(() => {
        showSpeech = false;
      }, 4000);
    }
  }

  function jump() {
    if (!isJumping) {
      isJumping = true;
      showSpeechBubble(getRandomSpeech());
      let jumpForce = isMobile ? -15 : -20;
      let gravity = 0.8;
      
      function jumpAnimation() {
        if (isJumping) {
          verticalPosition += jumpForce;
          jumpForce += gravity;

          scale = jumpForce < 0 ? 1.05 : 0.95;

          if (verticalPosition >= 0) {
            verticalPosition = 0;
            isJumping = false;
            scale = 1;
            
            setTimeout(() => {
              scale = 0.98;
              setTimeout(() => {
                scale = 1;
              }, 150);
            }, 50);
          } else {
            requestAnimationFrame(jumpAnimation);
          }
        }
      }
      
      jumpAnimation();
    }
  }

  function switchSides() {
    // Start moving first
    position = isFlipped ? SIDEBAR_WIDTH : (window.innerWidth - (isMobile ? 200 : 400));
    
    // Flip near the end of movement
    setTimeout(() => {
      isFlipped = !isFlipped;
      jump();
      showSpeechBubble(getRandomSpeech());
    }, 900); // Slightly before animation ends
  }

  onMount(() => {
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    // Show initial greeting only if not mobile
    if (!isMobile) {
      setTimeout(() => {
        showSpeechBubble(greetings[Math.floor(Math.random() * greetings.length)]);
      }, 500);
    }
    
    // Switch sides every 10 seconds
    let idleTimer: ReturnType<typeof setInterval>;
    idleTimer = setInterval(switchSides, 10000);
    
    // Smoother breathing animation
    const breathingAnimation = () => {
      const duration = 2000;
      const animate = () => {
        const progress = (Date.now() % duration) / duration;
        // Use sine wave for smooth oscillation
        breathScale = 1 + 0.015 * Math.sin(progress * 2 * Math.PI);
        requestAnimationFrame(animate);
      };
      animate();
    };
    
    breathingAnimation();
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
      clearInterval(idleTimer);
    };
  });
</script>

<div class="swap-page">
  <TitleImage img="swap" />
  <div class="swap-container">
    <Swap />
  </div>
  <div 
    class="kong-container"
    style="transform: translateX({position}px) translateY({verticalPosition}px)"
  >
    {#if showSpeech}
      <div 
        class="speech-bubble"
        class:flipped={isFlipped}
        transition:fade={{ duration: 200 }}
      >
        <span>{speechText}</span>
      </div>
    {/if}
    <img 
      src={kongImage} 
      alt="Kong" 
      class="kong-image"
      class:flipped={isFlipped}
      class:jumping={isJumping}
      style="transform: scaleX({!isFlipped ? -1 : 1}) scale({scale * breathScale})"
    />
  </div>
</div>

<style lang="postcss">
  .swap-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
    position: relative;
    min-height: 100vh;
  }

  .swap-container {
    width: 100%;
    margin-bottom: 100px;
  }

  .kong-container {
    position: fixed;
    bottom: 60px;
    left: 0;
    z-index: -1;
    pointer-events: none;
    will-change: transform;
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .kong-image {
    width: auto;
    height: 400px;
    transform-origin: center bottom;
    will-change: transform;
    filter: drop-shadow(0 0 20px rgba(0,0,0,0.4));
    transition: transform 0.069s ease;
  }

  .speech-bubble {
    position: absolute;
    top: -60px;
    left: 50%;
    transform: translateX(-50%);
    background: #fff;
    border: 3px solid #000;
    padding: 12px 16px;
    border-radius: 20px;
    font-family: 'Press Start 2P', monospace;
    font-size: 10px;
    white-space: pre-wrap;
    max-width: 260px;
    text-align: center;
    color: #000;
    box-shadow: 0 4px 0 rgba(0,0,0,0.2);
    z-index: 2;
    transition: transform 0.3s ease;
  }

  .speech-bubble::before,
  .speech-bubble::after {
    content: '';
    position: absolute;
    bottom: -12px;
    left: 50%;
    transform: translateX(-50%);
  }

  .speech-bubble::before {
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-top: 12px solid #000;
    bottom: -14px;
  }

  .speech-bubble::after {
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 8px solid #fff;
    bottom: -10px;
  }

  .speech-bubble.flipped {
    transform: translateX(-50%) scaleX(-1);
  }

  .speech-bubble.flipped span {
    display: inline-block;
    transform: scaleX(-1);
  }

  @media (max-width: 1024px) {
    .kong-image {
      height: 320px;
    }
  }

  @media (max-width: 768px) {
    .swap-page {
      padding: 0;
    }

    .kong-container {
      bottom: 47px;
    }

    .kong-image {
      height: 220px;
    }

    .speech-bubble {
      font-size: 9px;
      padding: 8px 12px;
      top: -35px;
      max-width: 140px;
    }
  }

  @media (max-width: 375px) {
    .kong-container {
      bottom: 55px;
    }

    .kong-image {
      height: 80px;
    }

    .speech-bubble {
      font-size: 7px;
      padding: 8px 14px;
      top: -40px;
      max-width: 300px;
    }
  }
</style>
