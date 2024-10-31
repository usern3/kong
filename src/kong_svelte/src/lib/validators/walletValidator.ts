import { isConnected, walletStore } from '$lib/stores/walletStore';
import { get } from 'svelte/store';

class WalletValidator {
  public static async requireWalletConnection(): Promise<void> {
    const wallet = get(walletStore);
    const connected = wallet.isConnected;
    if (!connected) {
      throw new Error('Wallet is not connected.');
    }
  }
}

export const walletValidator = WalletValidator;
