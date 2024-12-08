interface TradingViewWidget {
  widget: new (config: any) => any;
}

declare global {
  interface Window {
    TradingView?: TradingViewWidget;
  }
}

export async function loadTradingViewLibrary() {
  try {
    console.log('Loading TradingView library...');
    if (window.TradingView) {
      console.log('TradingView already loaded');
      return;
    }

    // Load the library
    const script = document.createElement('script');
    // Use absolute path and add crossorigin attribute
    script.src = window.location.origin + '/charting_library/charting_library/charting_library.js';
    script.type = 'text/javascript';
    script.async = true;
    script.crossOrigin = 'anonymous';

    const loadPromise = new Promise((resolve, reject) => {
      script.onload = () => {
        // Add a small delay to ensure the library is fully initialized
        setTimeout(() => {
          if (window.TradingView) {
            console.log('TradingView library loaded and initialized successfully');
            resolve(true);
          } else {
            reject(new Error('TradingView failed to initialize'));
          }
        }, 100);
      };
      script.onerror = (error) => {
        console.error('Failed to load TradingView library:', error);
        reject(error);
      };
    });

    document.head.appendChild(script);
    await loadPromise;
  } catch (error) {
    console.error('Error in loadTradingViewLibrary:', error);
    throw error;
  }
} 