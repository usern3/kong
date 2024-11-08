use candid::Nat;

use super::stable_lp_token_ledger::{StableLPTokenLedger, StableLPTokenLedgerId};

use crate::helpers::nat_helpers::{nat_add, nat_subtract, nat_zero};
use crate::ic::get_time::get_time;
use crate::stable_memory::LP_TOKEN_LEDGER;
use crate::stable_user::user_map;

pub const LP_DECIMALS: u8 = 8; // LP token decimal

/// get lp_token of the caller
pub fn get_by_token_id(token_id: u32) -> Option<StableLPTokenLedger> {
    let user_id = user_map::get_by_caller().ok().flatten()?.user_id;
    get_by_token_id_by_user_id(token_id, user_id)
}

/// get lp_token for specific user
pub fn get_by_token_id_by_user_id(token_id: u32, user_id: u32) -> Option<StableLPTokenLedger> {
    LP_TOKEN_LEDGER.with(|m| {
        m.borrow().iter().find_map(|(_, v)| {
            if v.user_id == user_id && v.token_id == token_id {
                return Some(v);
            }
            None
        })
    })
}

#[allow(dead_code)]
pub fn get() -> Vec<StableLPTokenLedger> {
    let user_id = match user_map::get_by_caller() {
        Ok(Some(caller)) => caller.user_id,
        Ok(None) | Err(_) => return Vec::new(),
    };
    LP_TOKEN_LEDGER.with(|m| {
        m.borrow()
            .iter()
            .filter_map(|(_, v)| if user_id == v.user_id { Some(v) } else { None })
            .collect()
    })
}

pub fn get_total_supply(token_id: u32) -> Nat {
    LP_TOKEN_LEDGER.with(|m| {
        m.borrow()
            .iter()
            .filter_map(|(_, v)| if v.token_id == token_id { Some(v.amount) } else { None })
            .fold(nat_zero(), |acc, x| nat_add(&acc, &x))
    })
}

pub fn insert(lp_token: &StableLPTokenLedger) -> u64 {
    LP_TOKEN_LEDGER.with(|m| {
        let mut map = m.borrow_mut();
        // with lock, increase lp_token id key
        let lp_token_id = map
            .iter()
            .map(|(k, _)| k.0)
            .max()
            .unwrap_or(0) // only if empty and first lp_token
            + 1;
        let insert_lp_token = StableLPTokenLedger {
            lp_token_id,
            ..lp_token.clone()
        };
        map.insert(StableLPTokenLedgerId(lp_token_id), insert_lp_token);
        lp_token_id
    })
}

pub fn update(lp_token: &StableLPTokenLedger) -> Option<StableLPTokenLedger> {
    LP_TOKEN_LEDGER.with(|m| m.borrow_mut().insert(StableLPTokenLedgerId(lp_token.lp_token_id), lp_token.clone()))
}

pub fn remove(lp_token_id: u32) -> Result<(), String> {
    LP_TOKEN_LEDGER.with(|m| {
        let mut lp_token_ledger = m.borrow_mut();
        let keys_to_remove: Vec<_> = lp_token_ledger
            .iter()
            .filter_map(|(k, v)| if v.token_id == lp_token_id { Some(k) } else { None })
            .collect();
        for key in keys_to_remove {
            lp_token_ledger.remove(&key);
        }
    });

    Ok(())
}

/// transfer LP token from caller to another user
///
/// # Arguments
/// token_id - token_id of the LP token
/// to_user_id - user_id of the user to transfer LP token to
/// amount - amount of LP token to transfer
///
/// # Returns
/// StableLPToken - updated LP token of the caller
/// Err - if LP token not found or not enough LP token
pub fn transfer(token_id: u32, to_user_id: u32, amount: &Nat) -> Result<StableLPTokenLedger, String> {
    let ts = get_time();

    let from_user = match get_by_token_id(token_id) {
        Some(from_user_lp_token) => {
            if from_user_lp_token.amount < *amount {
                return Err("Not enough LP token".to_string());
            }
            let amount = nat_subtract(&from_user_lp_token.amount, amount).ok_or("Error calculating new user balance")?;
            StableLPTokenLedger {
                amount,
                ts,
                ..from_user_lp_token
            }
        }
        None => return Err("Not enough LP token".to_string()),
    };
    update(&from_user);

    if let Some(to_user_lp_token) = get_by_token_id_by_user_id(token_id, to_user_id) {
        // to_user already has some LP token, add to existing balance
        update(&StableLPTokenLedger {
            amount: nat_add(&to_user_lp_token.amount, amount),
            ts,
            ..to_user_lp_token
        });
    } else {
        // otherwise, create new LP token for to_user
        insert(&StableLPTokenLedger::new(to_user_id, token_id, amount.clone(), ts));
    }

    Ok(from_user)
}
