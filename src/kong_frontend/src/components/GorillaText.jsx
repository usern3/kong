import React, { useEffect, useState } from 'react';
import kongImage from '../../../assets/kong.png';

// Import any necessary utilities or services to fetch or access token data

const GorillaText = ({ tokenDetails, poolInfo }) => {
  const [currentMessage, setCurrentMessage] = useState('');
  const [allMessages, setAllMessages] = useState([]);
  const [topTokens, setTopTokens] = useState([]);
  const [isBubbleVisible, setIsBubbleVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(true); // Start with animation enabled

  useEffect(() => {
    // Function to fetch or compute the top tokens by volume
    const fetchTopTokens = async () => {
      try {
        if (poolInfo && tokenDetails && tokenDetails.length > 0) {
          // Process pools and calculate volumes
          const getTokenDecimals = (tokenSymbol) => {
            // Logic to get token decimals
            if (!tokenDetails) return 8; // Default to 8 if tokenDetails not available

            const cleanedSymbol = tokenSymbol.includes('.')
              ? tokenSymbol.split('.')[1]
              : tokenSymbol;

            for (const tokenObj of tokenDetails) {
              const tokenKey = Object.keys(tokenObj)[0];
              const token = tokenObj[tokenKey];

              const cleanedTokenSymbol = token.symbol.includes('.')
                ? token.symbol.split('.')[1]
                : token.symbol;

              if (cleanedTokenSymbol === cleanedSymbol) {
                return token.decimals;
              }
            }

            return 8; // Default to 8 if token is not found
          };

          const updatedPools = poolInfo.map((pool) => {
            const decimals1 = getTokenDecimals(pool.symbol_1);
            const roll24hVolume =
              Number(pool.rolling_24h_volume || 0) / 10 ** decimals1;

            return {
              ...pool,
              roll24hVolume,
            };
          });

          // Sort pools by volume
          const sortedByVolume = [...updatedPools].sort(
            (a, b) => b.roll24hVolume - a.roll24hVolume
          );

          // Get top 3 tokens by volume
          const topTokensByVolume = sortedByVolume
            .slice(0, 3)
            .map((pool) => `${pool.symbol_0}/${pool.symbol_1}`);

          setTopTokens(topTokensByVolume);
        }
      } catch (error) {
        console.error('Error fetching top tokens:', error);
      }
    };

    fetchTopTokens();
  }, [tokenDetails, poolInfo]);

  useEffect(() => {
    // Original messages
    const messages = [
      "HODL like a gorilla holds a banana!",
      "Don’t let the bears scare you; gorillas are kings of the jungle!",
      "Going bananas over these crypto gains!",
      "Why swing from tree to tree when you can swing trade?",
      "In the jungle of crypto, always aim to be the King Kong of trading!",
      "Got crypto? Or just monkeying around?",
      "Don’t ape in, do your research!",
      "Bananas are sweet, but crypto is sweeter!",
      "Ever seen a gorilla panic sell? Exactly.",
      "Strong hands, like a gorilla’s grip!",
      "Swing high, swing low, but always swing with a plan!",
      "Even King Kong loves a good bull run!",
      "Big bananas come to those who wait!",
      "Gorilla wisdom: buy low, HODL strong!",
      "King Kong’s favorite altcoin? Whatever makes him the most bananas!",
      "Gorillas know: it’s not timing the market, but time in the market!",
      "Crypto market swings? Just another day in the jungle!",
      "King Kong says: keep your crypto safe like a banana stash!",
      "Ape in style, trade with a smile!",
      "Gorilla strength isn’t just physical; it’s mental for HODLing!",
      "From bananas to Bitcoin, it’s all about the stash!",
      "Gorillas don’t sweat the dips; they swing through them!",
      "Every gorilla knows: it’s not the size of the dip, but the size of the bounce!",
      "King Kong doesn’t just follow trends; he sets them!",
    ];

    // Create the dynamic message with the top tokens
    let topTokensMessage = '';
    if (topTokens && topTokens.length >= 3) {
      topTokensMessage = `Kong's top pools by volume are <span class="top-tokens">${topTokens[0]}</span>, <span class="top-tokens">${topTokens[1]}</span>, and <span class="top-tokens">${topTokens[2]}</span>!`;
    }

    // Interleave topTokensMessage with other messages
    const interleavedMessages = [];
    for (let i = 0; i < messages.length; i++) {
      interleavedMessages.push(messages[i]);
      if (topTokensMessage) {
        interleavedMessages.push(topTokensMessage);
      }
    }

    setAllMessages(interleavedMessages);

    // Set the initial message to the first message
    setCurrentMessage(interleavedMessages[0]);

    // Message rotation logic
    let messageIndex = 0;
    const intervalId = setInterval(() => {
      setTimeout(() => {
        messageIndex = (messageIndex + 1) % interleavedMessages.length;
        setCurrentMessage(interleavedMessages[messageIndex]);
        setIsBubbleVisible(true); // Show the bubble after the message has changed
        setIsAnimating(true); // Start animation
        setTimeout(() => setIsAnimating(false), 7000); // Stop animation after 7 seconds
      }, 300); // Adjust the delay as needed
    }, 8000); // Ensure this matches the animation duration

    return () => clearInterval(intervalId);
  }, [topTokens]);

  return (
    <div className="swap-page-kong-image-container">
      <img src={kongImage} className="swap-page-kong-image" alt="" />
      {currentMessage.length > 0 && isBubbleVisible && (
        <span className={`bubble bubble--swappage-kong bubble--text1 ${isAnimating ? 'animate' : ''}`}>
          <span className="bubble__top"></span>
          <span className="bubble__mid"></span>
          <span className="bubble__bottom"></span>
          <span
            className="bubble__content"
            dangerouslySetInnerHTML={{ __html: currentMessage }}
          ></span>
        </span>
      )}
    </div>
  );
};

export default GorillaText;