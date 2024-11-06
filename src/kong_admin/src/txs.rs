use kong_lib::stable_tx::stable_tx::{StableTx, StableTxId};
use kong_lib::stable_tx::status_tx::StatusTx;
use num_traits::ToPrimitive;
use postgres_types::{FromSql, ToSql};
use regex::Regex;
use serde_json::json;
use std::collections::BTreeMap;
use std::fs;
use std::fs::File;
use std::io::BufReader;
use tokio_postgres::Client;

use super::math_helpers::round_f64;

#[derive(Debug, ToSql, FromSql)]
#[postgres(name = "tx_type")]
enum TxType {
    #[postgres(name = "add_pool")]
    AddPool,
    #[postgres(name = "add_liquidity")]
    AddLiquidity,
    #[postgres(name = "remove_liquidity")]
    RemoveLiquidity,
    #[postgres(name = "swap")]
    Swap,
    #[postgres(name = "send")]
    Send,
}

#[derive(Debug, ToSql, FromSql)]
#[postgres(name = "tx_status")]
enum TxStatus {
    #[postgres(name = "Success")]
    Success,
    #[postgres(name = "Failed")]
    Failed,
}

pub async fn dump_txs(
    db_client: &Client,
    tokens_map: &BTreeMap<u32, u8>,
    pools_map: &BTreeMap<u32, (u32, u32)>,
) -> Result<(), Box<dyn std::error::Error>> {
    let dir_path = "./backups";
    let re_pattern = Regex::new(r"txs.*.json").unwrap();
    let files = fs::read_dir(dir_path)?
        .filter_map(|entry| entry.ok())
        .filter_map(|entry| {
            if re_pattern.is_match(entry.file_name().to_str().unwrap()) {
                Some(entry)
            } else {
                None
            }
        })
        .map(|entry| entry.path())
        .collect::<Vec<_>>();

    for file in files {
        let file = File::open(file)?;
        let reader = BufReader::new(file);
        let txs_map: BTreeMap<StableTxId, StableTx> = serde_json::from_reader(reader)?;

        for (k, v) in txs_map.iter() {
            match &v {
                StableTx::AddPool(v) => {
                    let tx_id = v.tx_id as i64;
                    let pool_id = v.pool_id as i32;
                    let request_id = v.request_id as i64;
                    let user_id = v.user_id as i32;
                    let tx_type = TxType::AddPool;
                    let status = match v.status {
                        StatusTx::Success => TxStatus::Success,
                        StatusTx::Failed => TxStatus::Failed,
                    };
                    let token_id_0 = pools_map.get(&v.pool_id).unwrap().0;
                    let decimals_0 = tokens_map
                        .get(&token_id_0)
                        .ok_or(format!("token_id={} not found", pools_map.get(&v.pool_id).unwrap().0))?;
                    let amount_0 = round_f64(v.amount_0.0.to_f64().unwrap() / 10_u64.pow(*decimals_0 as u32) as f64, *decimals_0);
                    let token_id_1 = pools_map.get(&v.pool_id).unwrap().1;
                    let decimals_1 = tokens_map
                        .get(&token_id_1)
                        .ok_or(format!("token_id={} not found", pools_map.get(&v.pool_id).unwrap().1))?;
                    let amount_1 = round_f64(v.amount_1.0.to_f64().unwrap() / 10_u64.pow(*decimals_1 as u32) as f64, *decimals_1);
                    let add_lp_token_amount = round_f64(v.add_lp_token_amount.0.to_f64().unwrap() / 10_u64.pow(8_u32) as f64, 8_u8);
                    let transfer_ids = v.transfer_ids.iter().map(|x| *x as i64).collect::<Vec<i64>>();
                    let claims_ids = v.claim_ids.iter().map(|x| *x as i64).collect::<Vec<i64>>();
                    let on_kong = v.on_kong;
                    let ts = v.ts as f64 / 1_000_000_000.0;
                    let raw_json = json!(&v);

                    db_client
                        .execute(
                            "INSERT INTO add_pool_tx
                                (tx_id, pool_id, request_id, user_id, status, amount_0, amount_1, add_lp_token_amount, transfer_ids, claim_ids, on_kong, ts)
                                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, to_timestamp($12))
                                ON CONFLICT (tx_id) DO UPDATE SET
                                    pool_id = $2,
                                    request_id = $3,
                                    user_id = $4,
                                    status = $5,
                                    amount_0 = $6,
                                    amount_1 = $7,
                                    add_lp_token_amount = $8,
                                    transfer_ids = $9,
                                    claim_ids = $10,
                                    on_kong = $11,
                                    ts = to_timestamp($12)",
                            &[&tx_id, &pool_id, &request_id, &user_id, &status, &amount_0, &amount_1, &add_lp_token_amount, &transfer_ids, &claims_ids, &on_kong, &ts],
                        )
                        .await?;

                    db_client
                        .execute(
                            "INSERT INTO txs
                                (tx_id, request_id, user_id, tx_type, status, ts, raw_json)
                                VALUES ($1, $2, $3, $4, $5, to_timestamp($6), $7)
                                ON CONFLICT (tx_id) DO UPDATE SET
                                    request_id = $2,
                                    user_id = $3,
                                    tx_type = $4,
                                    status = $5,
                                    ts = to_timestamp($6),
                                    raw_json = $7",
                            &[&tx_id, &request_id, &user_id, &tx_type, &status, &ts, &raw_json],
                        )
                        .await?;
                    println!("tx_id={} saved", k.0);
                }
                StableTx::AddLiquidity(v) => {
                    let tx_id = v.tx_id as i64;
                    let pool_id = v.pool_id as i32;
                    let request_id = v.request_id as i64;
                    let user_id = v.user_id as i32;
                    let tx_type = TxType::AddLiquidity;
                    let status = match v.status {
                        StatusTx::Success => TxStatus::Success,
                        StatusTx::Failed => TxStatus::Failed,
                    };
                    let token_id_0 = pools_map.get(&v.pool_id).unwrap().0;
                    let decimals_0 = tokens_map
                        .get(&token_id_0)
                        .ok_or(format!("token_id={} not found", pools_map.get(&v.pool_id).unwrap().0))?;
                    let amount_0 = round_f64(v.amount_0.0.to_f64().unwrap() / 10_u64.pow(*decimals_0 as u32) as f64, *decimals_0);
                    let token_id_1 = pools_map.get(&v.pool_id).unwrap().1;
                    let decimals_1 = tokens_map
                        .get(&token_id_1)
                        .ok_or(format!("token_id={} not found", pools_map.get(&v.pool_id).unwrap().1))?;
                    let amount_1 = round_f64(v.amount_1.0.to_f64().unwrap() / 10_u64.pow(*decimals_1 as u32) as f64, *decimals_1);
                    let add_lp_token_amount = round_f64(v.add_lp_token_amount.0.to_f64().unwrap() / 10_u64.pow(8_u32) as f64, 8_u8);
                    let transfer_ids = v.transfer_ids.iter().map(|x| *x as i64).collect::<Vec<i64>>();
                    let claims_ids = v.claim_ids.iter().map(|x| *x as i64).collect::<Vec<i64>>();
                    let ts = v.ts as f64 / 1_000_000_000.0;
                    let raw_json = json!(&v);

                    db_client
                        .execute(
                            "INSERT INTO add_liquidity_tx
                                (tx_id, pool_id, request_id, user_id, status, amount_0, amount_1, add_lp_token_amount, transfer_ids, claim_ids, ts)
                                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, to_timestamp($11))
                                ON CONFLICT (tx_id) DO UPDATE SET
                                    pool_id = $2,
                                    request_id = $3,
                                    user_id = $4,
                                    status = $5,
                                    amount_0 = $6,
                                    amount_1 = $7,
                                    add_lp_token_amount = $8,
                                    transfer_ids = $9,
                                    claim_ids = $10,
                                    ts = to_timestamp($11)",
                            &[&tx_id, &pool_id, &request_id, &user_id, &status, &amount_0, &amount_1, &add_lp_token_amount, &transfer_ids, &claims_ids, &ts],
                        )
                        .await?;

                    db_client
                        .execute(
                            "INSERT INTO txs
                                (tx_id, request_id, user_id, tx_type, status, ts, raw_json)
                                VALUES ($1, $2, $3, $4, $5, to_timestamp($6), $7)
                                ON CONFLICT (tx_id) DO UPDATE SET
                                    request_id = $2,
                                    user_id = $3,
                                    tx_type = $4,
                                    status = $5,
                                    ts = to_timestamp($6),
                                    raw_json = $7",
                            &[&tx_id, &request_id, &user_id, &tx_type, &status, &ts, &raw_json],
                        )
                        .await?;
                    println!("tx_id={} saved", k.0);
                }
                StableTx::RemoveLiquidity(v) => {
                    let tx_id = v.tx_id as i64;
                    let pool_id = v.pool_id as i32;
                    let request_id = v.request_id as i64;
                    let user_id = v.user_id as i32;
                    let tx_type = TxType::RemoveLiquidity;
                    let status = match v.status {
                        StatusTx::Success => TxStatus::Success,
                        StatusTx::Failed => TxStatus::Failed,
                    };
                    let token_id_0 = pools_map.get(&v.pool_id).unwrap().0;
                    let decimals_0 = tokens_map
                        .get(&token_id_0)
                        .ok_or(format!("token_id={} not found", pools_map.get(&v.pool_id).unwrap().0))?;
                    let amount_0 = round_f64(v.amount_0.0.to_f64().unwrap() / 10_u64.pow(*decimals_0 as u32) as f64, *decimals_0);
                    let lp_fee_0 = round_f64(v.lp_fee_0.0.to_f64().unwrap() / 10_u64.pow(*decimals_0 as u32) as f64, *decimals_0);
                    let token_id_1 = pools_map.get(&v.pool_id).unwrap().1;
                    let decimals_1 = tokens_map
                        .get(&token_id_1)
                        .ok_or(format!("token_id={} not found", pools_map.get(&v.pool_id).unwrap().1))?;
                    let amount_1 = round_f64(v.amount_1.0.to_f64().unwrap() / 10_u64.pow(*decimals_1 as u32) as f64, *decimals_1);
                    let lp_fee_1 = round_f64(v.lp_fee_1.0.to_f64().unwrap() / 10_u64.pow(*decimals_1 as u32) as f64, *decimals_1);
                    let remove_lp_token_amount = round_f64(v.remove_lp_token_amount.0.to_f64().unwrap() / 10_u64.pow(8_u32) as f64, 8_u8);
                    let transfer_ids = v.transfer_ids.iter().map(|x| *x as i64).collect::<Vec<i64>>();
                    let claims_ids = v.claim_ids.iter().map(|x| *x as i64).collect::<Vec<i64>>();
                    let ts = v.ts as f64 / 1_000_000_000.0;
                    let raw_json = json!(&v);

                    db_client
                        .execute(
                            "INSERT INTO remove_liquidity_tx
                            (tx_id, pool_id, request_id, user_id, status, amount_0, lp_fee_0, amount_1, lp_fee_1, remove_lp_token_amount, transfer_ids, claim_ids, ts)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, to_timestamp($13))
                            ON CONFLICT (tx_id) DO UPDATE SET
                                pool_id = $2,
                                request_id = $3,
                                user_id = $4,
                                status = $5,
                                amount_0 = $6,
                                lp_fee_0 = $7,
                                amount_1 = $8,
                                lp_fee_1 = $9,
                                remove_lp_token_amount = $10,
                                transfer_ids = $11,
                                claim_ids = $12,
                                ts = to_timestamp($13)",
                            &[
                                &tx_id,
                                &pool_id,
                                &request_id,
                                &user_id,
                                &status,
                                &amount_0,
                                &lp_fee_0,
                                &amount_1,
                                &lp_fee_1,
                                &remove_lp_token_amount,
                                &transfer_ids,
                                &claims_ids,
                                &ts,
                            ],
                        )
                        .await?;

                    db_client
                        .execute(
                            "INSERT INTO txs
                                (tx_id, request_id, user_id, tx_type, status, ts, raw_json)
                                VALUES ($1, $2, $3, $4, $5, to_timestamp($6), $7)
                                ON CONFLICT (tx_id) DO UPDATE SET
                                    request_id = $2,
                                    user_id = $3,
                                    tx_type = $4,
                                    status = $5,
                                    ts = to_timestamp($6),
                                    raw_json = $7",
                            &[&tx_id, &request_id, &user_id, &tx_type, &status, &ts, &raw_json],
                        )
                        .await?;
                    println!("tx_id={} saved", k.0);
                }
                StableTx::Swap(v) => {
                    let tx_id = v.tx_id as i64;
                    let request_id = v.request_id as i64;
                    let user_id = v.user_id as i32;
                    let tx_type = TxType::Swap;
                    let status = match v.status {
                        StatusTx::Success => TxStatus::Success,
                        StatusTx::Failed => TxStatus::Failed,
                    };
                    let pay_token_id = v.pay_token_id as i32;
                    let pay_decimal = tokens_map
                        .get(&v.pay_token_id)
                        .ok_or(format!("token_id={} not found", v.pay_token_id))?;
                    let pay_amount = round_f64(
                        v.pay_amount.0.to_f64().unwrap() / 10_u64.pow(*pay_decimal as u32) as f64,
                        *pay_decimal,
                    );
                    let receive_token_id = v.receive_token_id as i32;
                    let receive_decimal = tokens_map
                        .get(&v.receive_token_id)
                        .ok_or(format!("token_id={} not found", v.receive_token_id))?;
                    let receive_amount = round_f64(
                        v.receive_amount.0.to_f64().unwrap() / 10_u64.pow(*receive_decimal as u32) as f64,
                        *receive_decimal,
                    );
                    let price = v.price;
                    let mid_price = v.mid_price;
                    let slippage = v.slippage;
                    let transfer_ids = v.transfer_ids.iter().map(|x| *x as i64).collect::<Vec<i64>>();
                    let claim_ids = v.claim_ids.iter().map(|x| *x as i64).collect::<Vec<i64>>();
                    let ts = v.ts as f64 / 1_000_000_000.0;
                    let raw_json = json!(&v);

                    db_client
                        .execute(
                            "INSERT INTO swap_tx
                            (tx_id, request_id, user_id, status, pay_token_id, pay_amount, receive_token_id, receive_amount, price, mid_price, slippage, transfer_ids, claim_ids, ts)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, to_timestamp($14))
                            ON CONFLICT (tx_id) DO UPDATE SET
                                request_id = $2,
                                user_id = $3,
                                status = $4,
                                pay_token_id = $5,
                                pay_amount = $6,
                                receive_token_id = $7,
                                receive_amount = $8,
                                price = $9,
                                mid_price = $10,
                                slippage = $11,
                                transfer_ids = $12,
                                claim_ids = $13,
                                ts = to_timestamp($14)",
                            &[
                                &tx_id,
                                &request_id,
                                &user_id,
                                &status,
                                &pay_token_id,
                                &pay_amount,
                                &receive_token_id,
                                &receive_amount,
                                &price,
                                &mid_price,
                                &slippage,
                                &transfer_ids,
                                &claim_ids,
                                &ts,
                            ],
                        )
                        .await?;

                    db_client.execute("DELETE FROM swap_tx_txs WHERE tx_id = $1", &[&tx_id]).await?;

                    for swap in v.txs.iter() {
                        let pay_token_id = swap.pay_token_id as i32;
                        let pay_decimal = tokens_map
                            .get(&swap.pay_token_id)
                            .ok_or(format!("token_id={} not found", &swap.pay_token_id))?;
                        let pay_amount = round_f64(
                            swap.pay_amount.0.to_f64().unwrap() / 10_u64.pow(*pay_decimal as u32) as f64,
                            *pay_decimal,
                        );
                        let receive_token_id = swap.receive_token_id as i32;
                        let receive_decimal = tokens_map
                            .get(&swap.receive_token_id)
                            .ok_or(format!("token_id={} not found", &swap.receive_token_id))?;
                        let receive_amount = round_f64(
                            swap.receive_amount.0.to_f64().unwrap() / 10_u64.pow(*receive_decimal as u32) as f64,
                            *receive_decimal,
                        );
                        let lp_fee = round_f64(
                            swap.lp_fee.0.to_f64().unwrap() / 10_u64.pow(*pay_decimal as u32) as f64,
                            *pay_decimal,
                        );
                        let gas_fee = round_f64(
                            swap.gas_fee.0.to_f64().unwrap() / 10_u64.pow(*pay_decimal as u32) as f64,
                            *pay_decimal,
                        );

                        db_client
                            .execute(
                                "INSERT INTO swap_tx_txs
                                (tx_id, pay_token_id, pay_amount, receive_token_id, receive_amount, lp_fee, gas_fee)
                                VALUES ($1, $2, $3, $4, $5, $6, $7)",
                                &[
                                    &tx_id,
                                    &pay_token_id,
                                    &pay_amount,
                                    &receive_token_id,
                                    &receive_amount,
                                    &lp_fee,
                                    &gas_fee,
                                ],
                            )
                            .await?;
                    }

                    db_client
                        .execute(
                            "INSERT INTO txs
                                (tx_id, request_id, user_id, tx_type, status, ts, raw_json)
                                VALUES ($1, $2, $3, $4, $5, to_timestamp($6), $7)
                                ON CONFLICT (tx_id) DO UPDATE SET
                                    request_id = $2,
                                    user_id = $3,
                                    tx_type = $4,
                                    status = $5,
                                    ts = to_timestamp($6),
                                    raw_json = $7",
                            &[&tx_id, &request_id, &user_id, &tx_type, &status, &ts, &raw_json],
                        )
                        .await?;
                    println!("tx_id={} saved", k.0);
                }
                StableTx::Send(v) => {
                    let tx_id = v.tx_id as i64;
                    let token_id = v.token_id as i32;
                    let request_id = v.request_id as i64;
                    let user_id = v.user_id as i32;
                    let tx_type = TxType::Send;
                    let status = match v.status {
                        StatusTx::Success => TxStatus::Success,
                        StatusTx::Failed => TxStatus::Failed,
                    };
                    let decimals = tokens_map.get(&v.token_id).ok_or(format!("token_id={} not found", v.token_id))?;
                    let amount = round_f64(v.amount.0.to_f64().unwrap() / 10_u64.pow(*decimals as u32) as f64, *decimals);
                    let to_user_id = v.to_user_id as i32;
                    let ts = v.ts as f64 / 1_000_000_000.0;
                    let raw_json = json!(&v);

                    db_client
                        .execute(
                            "INSERT INTO send_tx
                            (tx_id, token_id, request_id, user_id, status, amount, to_user_id, ts)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, to_timestamp($8))
                            ON CONFLICT (tx_id) DO UPDATE SET
                                token_id = $2,
                                request_id = $3,
                                user_id = $4,
                                status = $5,
                                amount = $6,
                                to_user_id = $7,
                                ts = to_timestamp($8)",
                            &[&tx_id, &token_id, &request_id, &user_id, &status, &amount, &to_user_id, &ts],
                        )
                        .await?;

                    db_client
                        .execute(
                            "INSERT INTO txs
                                (tx_id, request_id, user_id, tx_type, status, ts, raw_json)
                                VALUES ($1, $2, $3, $4, $5, to_timestamp($6), $7)
                                ON CONFLICT (tx_id) DO UPDATE SET
                                    request_id = $2,
                                    user_id = $3,
                                    tx_type = $4,
                                    status = $5,
                                    ts = to_timestamp($6),
                                    raw_json = $7",
                            &[&tx_id, &request_id, &user_id, &tx_type, &status, &ts, &raw_json],
                        )
                        .await?;
                    println!("tx_id={} saved", k.0);
                }
            };
        }
    }

    Ok(())
}
