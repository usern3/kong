use super::add_liquidity_reply::AddLiquidityReply;

use crate::stable_pool::pool_map;
use crate::stable_token::token::Token;
use crate::stable_tx::add_liquidity_tx::AddLiquidityTx;
use crate::transfers::transfer_reply_helpers::to_transfer_ids;

pub fn create_add_liquidity_reply(add_liquidity_tx: &AddLiquidityTx) -> AddLiquidityReply {
    create_add_liquidity_reply_with_tx_id(add_liquidity_tx.tx_id, add_liquidity_tx)
}

pub fn create_add_liquidity_reply_with_tx_id(tx_id: u64, add_liquidity_tx: &AddLiquidityTx) -> AddLiquidityReply {
    let (symbol, chain_0, address_0, symbol_0, chain_1, address_1, symbol_1) = pool_map::get_by_pool_id(add_liquidity_tx.pool_id)
        .map_or_else(
            || {
                (
                    "Pool symbol not found".to_string(),
                    "Pool chain_0 not found".to_string(),
                    "Pool address_0 not found".to_string(),
                    "Pool symbol_0 not found".to_string(),
                    "Pool chain_1 not found".to_string(),
                    "Pool address_1 not found".to_string(),
                    "Pool symbol_1 not found".to_string(),
                )
            },
            |pool| {
                let token_0 = pool.token_0();
                let chain_0 = token_0.chain();
                let address_0 = token_0.address();
                let symbol_0 = token_0.symbol();
                let token_1 = pool.token_1();
                let chain_1 = token_1.chain();
                let address_1 = token_1.address();
                let symbol_1 = token_1.symbol();
                (pool.symbol(), chain_0, address_0, symbol_0, chain_1, address_1, symbol_1)
            },
        );
    AddLiquidityReply {
        tx_id,
        symbol,
        request_id: add_liquidity_tx.request_id,
        status: add_liquidity_tx.status.to_string(),
        chain_0,
        address_0,
        symbol_0,
        amount_0: add_liquidity_tx.amount_0.clone(),
        chain_1,
        address_1,
        symbol_1,
        amount_1: add_liquidity_tx.amount_1.clone(),
        add_lp_token_amount: add_liquidity_tx.add_lp_token_amount.clone(),
        transfer_ids: to_transfer_ids(&add_liquidity_tx.transfer_ids),
        claim_ids: add_liquidity_tx.claim_ids.clone(),
        ts: add_liquidity_tx.ts,
    }
}
