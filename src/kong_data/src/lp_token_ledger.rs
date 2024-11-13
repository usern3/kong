use ic_cdk::{query, update};
use kong_lib::stable_lp_token_ledger::stable_lp_token_ledger::{StableLPTokenLedger, StableLPTokenLedgerId};
use std::collections::BTreeMap;

use super::guards::caller_is_kingkong;
use super::stable_memory::LP_TOKEN_LEDGER;

const MAX_LP_TOKEN_LEDGER: usize = 1_000;

#[query(hidden = true, guard = "caller_is_kingkong")]
fn backup_lp_token_ledger(lp_token_id: Option<u64>, num_lp_token_ledger: Option<u16>) -> Result<String, String> {
    LP_TOKEN_LEDGER.with(|m| {
        let map = m.borrow();
        let lp_tokens: BTreeMap<_, _> = match lp_token_id {
            Some(lp_token_id) => {
                let num_lp_token_ledger = num_lp_token_ledger.map_or(1, |n| n as usize);
                let start_key = StableLPTokenLedgerId(lp_token_id);
                map.range(start_key..).take(num_lp_token_ledger).collect()
            }
            None => {
                let num_lp_token_ledger = num_lp_token_ledger.map_or(MAX_LP_TOKEN_LEDGER, |n| n as usize);
                map.iter().take(num_lp_token_ledger).collect()
            }
        };

        serde_json::to_string(&lp_tokens).map_err(|e| format!("Failed to serialize LP tokens: {}", e))
    })
}

#[update(hidden = true, guard = "caller_is_kingkong")]
fn archive_lp_token_ledger(stable_lp_token_ledger: String) -> Result<String, String> {
    let lp_token_ledgers: BTreeMap<StableLPTokenLedgerId, StableLPTokenLedger> = match serde_json::from_str(&stable_lp_token_ledger) {
        Ok(lp_token_ledgers) => lp_token_ledgers,
        Err(e) => return Err(format!("Invalid LP tokens: {}", e)),
    };

    LP_TOKEN_LEDGER.with(|user_map| {
        let mut map = user_map.borrow_mut();
        for (k, v) in lp_token_ledgers.into_iter() {
            map.insert(k, v);
        }
    });

    Ok("LP tokens archived".to_string())
}