use ic_cdk::query;
use std::collections::BTreeMap;

use crate::ic::guards::caller_is_kingkong;
use crate::stable_claim::stable_claim::StableClaimId;
use crate::stable_memory::CLAIM_MAP;

const MAX_CLAIMS: usize = 1_000;

#[query(hidden = true, guard = "caller_is_kingkong")]
fn backup_claims(claim_id: Option<u64>, num_claims: Option<u16>) -> Result<String, String> {
    CLAIM_MAP.with(|m| {
        let map = m.borrow();
        let claims: BTreeMap<_, _> = match claim_id {
            Some(claim_id) => {
                let num_claims = num_claims.map_or(1, |n| n as usize);
                let start_key = StableClaimId(claim_id);
                map.range(start_key..).take(num_claims).collect()
            }
            None => {
                let num_claims = num_claims.map_or(MAX_CLAIMS, |n| n as usize);
                map.iter().take(num_claims).collect()
            }
        };

        serde_json::to_string(&claims).map_err(|e| format!("Failed to serialize claims: {}", e))
    })
}
