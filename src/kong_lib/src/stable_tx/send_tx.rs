use candid::{CandidType, Nat};
use serde::{Deserialize, Serialize};

use super::status_tx::StatusTx;

#[derive(CandidType, Debug, Clone, Serialize, Deserialize)]
pub struct SendTx {
    pub tx_id: u64,
    pub token_id: u32,
    pub request_id: u64,
    pub user_id: u32,
    pub status: StatusTx,
    pub amount: Nat,
    pub to_user_id: u32,
    pub ts: u64,
}
