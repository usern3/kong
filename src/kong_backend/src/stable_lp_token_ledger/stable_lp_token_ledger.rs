use candid::{CandidType, Decode, Encode, Nat};
use ic_stable_structures::{storable::Bound, Storable};
use serde::{Deserialize, Serialize};
use std::borrow::Cow;

const LP_TOKEN_ID_SIZE: u32 = std::mem::size_of::<u64>() as u32;

#[derive(CandidType, Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub struct StableLPTokenLedgerId(pub u64);

impl Storable for StableLPTokenLedgerId {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        self.0.to_bytes() // u64 is already Storable
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Self(u64::from_bytes(bytes))
    }

    // u64 is fixed size
    const BOUND: Bound = Bound::Bounded {
        max_size: LP_TOKEN_ID_SIZE,
        is_fixed_size: true,
    };
}

#[derive(CandidType, Debug, Clone, Serialize, Deserialize)]
pub struct StableLPTokenLedger {
    pub lp_token_id: u64, // unique id (same as StableLPTokenLedgerId) for LP_TOKEN_LEDGER
    pub user_id: u32,     // user id of the token holder
    pub token_id: u32,    // token id of the token
    pub amount: Nat,      // amount the user holds of the token
    pub ts: u64,          // timestamp of the last token update
}

impl Storable for StableLPTokenLedger {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    // unbounded size
    const BOUND: Bound = Bound::Unbounded;
}
