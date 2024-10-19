use candid::Principal;
use ic_cdk::update;

use super::add_token_args::AddTokenArgs;
use super::add_token_reply::{to_add_token_reply, AddTokenReply};

use crate::canister::guards::caller_is_kingkong;
use crate::chains::chains::{IC_CHAIN, LP_CHAIN};
use crate::stable_token::ic_token::ICToken;
use crate::stable_token::stable_token::StableToken;
use crate::stable_token::token_map;

/// Adds a token to the system
///
/// # Arguments
///
/// * `args` - The arguments for adding a token.
///
/// # Returns
///
/// * `Ok(String)` - A success message if the token is added successfully.
/// * `Err(String)` - An error message if the operation fails.
///
/// # Errors
///
/// This function returns an error if:
/// - The caller is not a controller.
/// - The token already exists.
#[update(guard = "caller_is_kingkong")]
async fn add_token(args: AddTokenArgs) -> Result<AddTokenReply, String> {
    // Ensure the token does not already exist.
    if token_map::get_by_address(&args.token).is_ok() {
        return Err(format!("Add token {} already exists", args.token));
    }

    // Default on_kong to false
    let on_kong = args.on_kong.unwrap_or(false);

    // Only IC tokens of format IC.CanisterId supported
    match token_map::get_chain(&args.token) {
        Some(chain) if chain == IC_CHAIN => to_add_token_reply(&add_ic_token(&args.token, on_kong).await?),
        Some(chain) if chain == LP_CHAIN => Err("LP tokens not supported".to_string()),
        Some(_) | None => Err("Chain not specified or supported".to_string()),
    }
}

/// Adds an Internet Computer (IC) token to the system.
///
/// # Arguments
///
/// * `token` - The address of the token to be added. Must be in the format IC.CanisterId.
/// * `on_kong` - A boolean indicating whether the token is on Kong.
///
/// # Returns
///
/// * `Ok(StableToken)` - The newly added token.
/// * `Err(String)` - An error message if the operation fails.
///
/// # Errors
///
/// This function returns an error if:
/// - The address of the token is not found.
/// - The address cannot be converted to a `Principal`.
/// - Creating the `ICToken` fails.
/// - Inserting the token into the token map fails.
/// - Retrieving the inserted token fails.
pub async fn add_ic_token(token: &str, on_kong: bool) -> Result<StableToken, String> {
    // Retrieves the address of the token.
    let address = token_map::get_address(token).ok_or_else(|| format!("Invalid address {}", token))?;

    // Converts the address to a `Principal`.
    let canister_id = Principal::from_text(address).map_err(|e| format!("Invalid canister id {}: {}", token, e))?;

    // Creates a new `ICToken`.
    let ic_token = StableToken::IC(ICToken::new(&canister_id, on_kong).await?);

    // Inserts the new `ICToken` into the token map.
    let token_id = token_map::insert(&ic_token)?;

    // Retrieves the inserted token by its ID.
    token_map::get_by_token_id(token_id).ok_or_else(|| format!("Failed to add token {}", token))
}