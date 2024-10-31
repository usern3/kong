import type { SwapQuoteResponse, SwapAsyncResponse, RequestResponse } from '$lib/types/backend';
import { getActor } from '$lib/stores/walletStore';

export class SwapService {
  protected static instance: SwapService;

  public static getInstance(): SwapService {
    if (!SwapService.instance) {
      SwapService.instance = new SwapService();
    }
    return SwapService.instance;
  }

  public static async getSwapAmounts(payToken: string, payAmount: bigint, receiveToken: string): Promise<SwapQuoteResponse> {
    try {
      const actor = await getActor();
      return await actor.swap_amounts(payToken, payAmount, receiveToken);
    } catch (error) {
      console.error('Error getting swap amounts:', error);
      throw error;
    }
  }

  public static async swapAsync(params: {
    pay_token: string;
    pay_amount: bigint;
    receive_token: string;
    receive_amount: bigint[];
    max_slippage: number[];
    receive_address?: string[];
    referred_by?: string[];
    pay_tx_id?: string[];
  }): Promise<SwapAsyncResponse> {
    try {
      const actor = await getActor();
      return await actor.swap_async(params);
    } catch (error) {
      console.error('Error executing swap:', error);
      throw error;
    }
  }

  public static async getRequests(requestIds: bigint[]): Promise<RequestResponse> {
    try {
      const actor = await getActor();
      return await actor.requests(requestIds);
    } catch (error) {
      console.error('Error getting request status:', error);
      throw error;
    }
  }
} 