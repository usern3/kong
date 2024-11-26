use crate::stable_tx::stable_tx::{StableTx, StableTxId};
use ic_cdk::{query, update};
use std::collections::BTreeMap;

use crate::ic::guards::caller_is_kingkong;
use crate::stable_memory::TX_MAP;
use crate::stable_tx::tx_map;
use crate::txs::txs_reply::TxsReply;
use crate::txs::txs_reply_helpers::to_txs_reply;

const MAX_TXS: usize = 1_000;

#[query(hidden = true, guard = "caller_is_kingkong")]
fn backup_txs(tx_id: Option<u64>, num_txs: Option<u16>) -> Result<String, String> {
    TX_MAP.with(|m| {
        let map = m.borrow();
        let txs: BTreeMap<_, _> = match tx_id {
            Some(tx_id) => {
                let num_txs = num_txs.map_or(1, |n| n as usize);
                let start_key = StableTxId(tx_id);
                map.range(start_key..).take(num_txs).collect()
            }
            None => {
                let num_txs = num_txs.map_or(MAX_TXS, |n| n as usize);
                map.iter().take(num_txs).collect()
            }
        };
        serde_json::to_string(&txs).map_err(|e| format!("Failed to serialize txs: {}", e))
    })
}

#[update(hidden = true, guard = "caller_is_kingkong")]
fn update_txs(stable_txs_json: String) -> Result<String, String> {
    let txs: BTreeMap<StableTxId, StableTx> = match serde_json::from_str(&stable_txs_json) {
        Ok(txs) => txs,
        Err(e) => return Err(format!("Invalid txs: {}", e)),
    };

    TX_MAP.with(|tx_map| {
        let mut map = tx_map.borrow_mut();
        for (k, v) in txs {
            map.insert(k, v);
        }
    });

    Ok("Txs updated".to_string())
}

#[query(hidden = true, guard = "caller_is_kingkong")]
fn get_txs(tx_id: Option<u64>, user_id: Option<u32>, token_id: Option<u32>, num_txs: Option<u16>) -> Result<Vec<TxsReply>, String> {
    let num_txs = num_txs.map(|n| n as usize);
    let txs = tx_map::get_by_user_and_token_id(tx_id, user_id, token_id, num_txs)
        .iter()
        .map(to_txs_reply)
        .collect();
    Ok(txs)
}