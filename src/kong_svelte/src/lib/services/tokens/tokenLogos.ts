import { kongDB } from '../db';
import { ICP_CANISTER_ID } from '$lib/constants/canisterConstants';
import { writable, get } from 'svelte/store';
import { getTokenMetadata } from './tokenUtils';

export const IMAGE_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
export const DEFAULT_LOGOS = {
  [ICP_CANISTER_ID]: '/tokens/icp.webp',
  DEFAULT: '/tokens/not_verified.webp'
} as const;

export const tokenLogoStore = writable<Record<string, string>>({
  ...DEFAULT_LOGOS
});

let loadingPromises: Record<string, Promise<string>> = {};

export async function saveTokenLogo(canister_id: string, image_url: string): Promise<void> {
  try {
    await kongDB.images.put({
      canister_id,
      image_url,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error saving token logo:', error);
  }
}

export async function getTokenLogo(canister_id: string): Promise<string> {
  try {
    const image = await kongDB.images.get({ canister_id });
    if (!image) {
      return DEFAULT_LOGOS.DEFAULT;
    }

    // Check if the logo is older than 24 hours
    const ONE_DAY = 24 * 60 * 60 * 1000;
    if (!image.timestamp || Date.now() - image.timestamp > ONE_DAY) {
      // Logo is too old, delete it and refetch
      await kongDB.images.delete(image.id);
      return await fetchTokenLogo({ canister_id });
    }

    return image.image_url || DEFAULT_LOGOS.DEFAULT;
  } catch (error) {
    console.error('Error getting token logo:', error);
    return DEFAULT_LOGOS.DEFAULT;
  }
}

export async function getTokenLogoById(id: number): Promise<any | null> {
  try {
    const image = await kongDB.images.get(id);
    if (image && Date.now() - image.timestamp < IMAGE_CACHE_DURATION) {
      return image;
    }
    return null;
  } catch (error) {
    console.error('Error getting image by id:', error);
    return null;
  }
}

export async function bulkSaveTokenLogos(
  images: Array<{ canister_id: string; image_url: string }>
): Promise<void> {
  try {
    await kongDB.transaction('rw', kongDB.images, async () => {
      const timestamp = Date.now();
      const entries = images.map(img => ({
        canister_id: img.canister_id,
        image_url: img.image_url,
        timestamp
      }));
      await kongDB.images.bulkAdd(entries);
    });
  } catch (error) {
    console.error('Error bulk saving images:', error);
  }
}

export async function getMultipleTokenLogos(canister_ids: string[]): Promise<Record<string, string>> {
  try {
    const currentTime = Date.now();
    const validImages = await kongDB.images
      .where('canister_id')
      .anyOf(canister_ids)
      .and(image => currentTime - image.timestamp < IMAGE_CACHE_DURATION)
      .toArray();

    const result: Record<string, string> = {};
    validImages.forEach(img => {
      result[img.canister_id] = img.image_url;
    });

    // Update store with all valid images
    tokenLogoStore.update(logos => ({
      ...logos,
      ...result
    }));

    // Clean up expired entries
    const foundIds = new Set(validImages.map(img => img.canister_id));
    const expiredIds = canister_ids.filter(id => !foundIds.has(id));
    
    if (expiredIds.length > 0) {
      await kongDB.images
        .where('canister_id')
        .anyOf(expiredIds)
        .delete();
    }

    return result;
  } catch (error) {
    console.error('Error getting multiple images:', error);
    return {};
  }
}

export async function getAllTokenLogos(tokens: any[]): Promise<any[]> {
  try {
    const currentTime = Date.now();
    
    // First get all cached images
    const cachedImages = await kongDB.images
      .where('timestamp')
      .above(currentTime - IMAGE_CACHE_DURATION)
      .toArray();
    
    // Create a map of cached canister IDs
    const cachedCanisterIds = new Set(cachedImages.map(img => img.canister_id));
    
    // For tokens without cached logos, fetch them
    const fetchPromises = tokens
      .filter(token => !cachedCanisterIds.has(token.canister_id))
      .map(async token => {
        try {
          const image_url = await fetchTokenLogo(token);
          const newImage = {
            canister_id: token.canister_id,
            image_url,
            timestamp: Date.now()
          };
          await saveTokenLogo(token.canister_id, image_url);
          return newImage;
        } catch (error) {
          console.error(`Error fetching logo for token ${token.canister_id}:`, error);
          return null;
        }
      });

    const fetchedImages = (await Promise.all(fetchPromises)).filter((img): img is any => 
      img !== null 
    );
    
    return [...cachedImages, ...fetchedImages];
  } catch (error) {
    console.error('Error getting all images:', error);
    return [];
  }
}

export async function deleteTokenLogo(id: number): Promise<void> {
  try {
    await kongDB.images.delete(id);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}

export async function updateTokenLogo(
  id: number, 
  updates: any
): Promise<number> {
  try {
    const image = await kongDB.images.get(id);
    if (!image) {
      throw new Error('Image not found');
    }

    const updatedImage = {
      ...image,
      ...updates,
      timestamp: Date.now(), // Reset timestamp on update
    };

    return await kongDB.images.put(updatedImage);
  } catch (error) {
    console.error('Error updating image:', error);
    throw error;
  }
}

export async function cleanupExpiredTokenLogos(): Promise<void> {
  try {
    const expirationTime = Date.now() - IMAGE_CACHE_DURATION;
    await kongDB.transaction('rw', kongDB.images, async () => {
      await kongDB.images
        .where('timestamp')
        .below(expirationTime)
        .delete();
    });
  } catch (error) {
    console.error('Error cleaning up expired images:', error);
  }
}

export async function fetchTokenLogo(token: any): Promise<string> {
  const MAX_RETRIES = 1;
  const RETRY_DELAY = 1000; // 1 second

  try {
    if (!token?.canister_id) {
      console.debug('No canister_id for token:', token);
      return DEFAULT_LOGOS.DEFAULT;
    }

    // Use a local variable to track our loading promise
    let loadingPromise = loadingPromises[token.canister_id];
    if (loadingPromise) {
      try {
        return await loadingPromise;
      } catch (error) {
        console.warn('Previous loading attempt failed:', error);
        // Clear the failed promise so we can try again
        delete loadingPromises[token.canister_id];
      }
    }

    // Create a new loading promise
    loadingPromise = (async () => {
      try {          
        // Check cache first
        const cachedLogo = await getTokenLogo(token.canister_id);
        if (cachedLogo && cachedLogo !== DEFAULT_LOGOS.DEFAULT) {
          return cachedLogo;
        }

        let retryCount = 0;
        let lastError: Error | null = null;

        while (retryCount < MAX_RETRIES) {
          try {
            // Fetch metadata with timeout
            const metadataPromise = getTokenMetadata(token.canister_id);
            const metadata = await Promise.race([
              metadataPromise,
              new Promise((_, reject) => setTimeout(() => reject(new Error('Metadata fetch timeout')), 10000))
            ]);

            // Try all possible logo keys
            const logoKeys = ['icrc1:logo', 'icrc1:icrc1_logo', 'logo', 'icrc1_logo'];
            let logoEntry = null;
            
            for (const key of logoKeys) {
              const entry = metadata.find(([k]) => k === key);
              if (entry) {
                logoEntry = entry;
                break;
              }
            }

            if (!logoEntry) {
              console.warn('No logo found in metadata');
              return DEFAULT_LOGOS.DEFAULT;
            }

            const [_, value] = logoEntry;
            
            // Handle both Text and Blob formats
            if ('Text' in value && value.Text) {
              // Validate URL format
              try {
                new URL(value.Text);
                await saveTokenLogo(token.canister_id, value.Text);
                return value.Text;
              } catch {
                throw new Error('Invalid logo URL format');
              }
            } else if ('Blob' in value && value.Blob) {
              try {
                const base64 = btoa(String.fromCharCode(...value.Blob));
                const mimeType = 'image/png';
                const dataUrl = `data:${mimeType};base64,${base64}`;
                
                // Validate the data URL by loading it
                await new Promise((resolve, reject) => {
                  const img = new Image();
                  img.onload = resolve;
                  img.onerror = () => reject(new Error('Failed to load data URL'));
                  img.src = dataUrl;
                });
                
                await saveTokenLogo(token.canister_id, dataUrl);
                return dataUrl;
              } catch (error) {
                throw new Error(`Failed to process Blob logo: ${error}`);
              }
            }

            return DEFAULT_LOGOS.DEFAULT;
          } catch (error) {
            lastError = error as Error;
            retryCount++;
            
            if (retryCount < MAX_RETRIES) {
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCount));
            }
          }
        }

        return DEFAULT_LOGOS.DEFAULT;
      } finally {
        // Clean up the loading promise when done
        delete loadingPromises[token.canister_id];
      }
    })();

    // Store the promise for deduplication
    loadingPromises[token.canister_id] = loadingPromise;
    return loadingPromise;
  } catch (error) {
    console.error('Error in fetchTokenLogo:', error);
    return DEFAULT_LOGOS.DEFAULT;
  }
}