use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap};
use kong_lib::stable_claim::stable_claim::{StableClaim, StableClaimId};
use kong_lib::stable_lp_token_ledger::stable_lp_token_ledger::{StableLPTokenLedger, StableLPTokenLedgerId};
use kong_lib::stable_message::stable_message::{StableMessage, StableMessageId};
use kong_lib::stable_pool::stable_pool::{StablePool, StablePoolId};
use kong_lib::stable_request::stable_request::{StableRequest, StableRequestId};
use kong_lib::stable_token::stable_token::{StableToken, StableTokenId};
use kong_lib::stable_transfer::stable_transfer::{StableTransfer, StableTransferId};
use kong_lib::stable_tx::stable_tx::{StableTx, StableTxId};
use kong_lib::stable_user::stable_user::{StableUser, StableUserId};
use std::cell::RefCell;

type Memory = VirtualMemory<DefaultMemoryImpl>;

pub const KONG_SETTINGS_ID: MemoryId = MemoryId::new(0);
pub const USER_MEMORY_ID: MemoryId = MemoryId::new(1);
pub const TOKEN_MEMORY_ID: MemoryId = MemoryId::new(2);
pub const POOL_MEMORY_ID: MemoryId = MemoryId::new(3);
pub const TX_MEMORY_ID: MemoryId = MemoryId::new(4);
pub const REQUEST_MEMORY_ID: MemoryId = MemoryId::new(5);
pub const TRANSFER_MEMORY_ID: MemoryId = MemoryId::new(6);
pub const CLAIM_MEMORY_ID: MemoryId = MemoryId::new(7);
pub const LP_TOKEN_LEDGER_MEMORY_ID: MemoryId = MemoryId::new(8);
pub const MESSAGE_MEMORY_ID: MemoryId = MemoryId::new(9);

thread_local! {
    // MEMORY_MANAGER is given management of the entire stable memory. Given a 'MemoryId', it can
    // return a memory that can be used by stable structures
    pub static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    // stable memory for storing user profiles
    pub static USER_MAP: RefCell<StableBTreeMap<StableUserId, StableUser, Memory>> = with_memory_manager(|memory_manager| {
        RefCell::new(StableBTreeMap::init(memory_manager.get(USER_MEMORY_ID)))
    });

    // stable memory for storing tokens supported by the system
    pub static TOKEN_MAP: RefCell<StableBTreeMap<StableTokenId, StableToken, Memory>> = with_memory_manager(|memory_manager| {
        RefCell::new(StableBTreeMap::init(memory_manager.get(TOKEN_MEMORY_ID)))
    });

    // stable memory for storing pools
    pub static POOL_MAP: RefCell<StableBTreeMap<StablePoolId, StablePool, Memory>> = with_memory_manager(|memory_manager| {
        RefCell::new(StableBTreeMap::init(memory_manager.get(POOL_MEMORY_ID)))
    });

    // stable memory for storing all transactions
    pub static TX_MAP: RefCell<StableBTreeMap<StableTxId, StableTx, Memory>> = with_memory_manager(|memory_manager| {
        RefCell::new(StableBTreeMap::init(memory_manager.get(TX_MEMORY_ID)))
    });

    // stable memory for storing all requests made by users
    pub static REQUEST_MAP: RefCell<StableBTreeMap<StableRequestId, StableRequest, Memory>> = with_memory_manager(|memory_manager| {
        RefCell::new(StableBTreeMap::init(memory_manager.get(REQUEST_MEMORY_ID)))
    });

    // stable memory for storing all on-chain transfers with block_id. used to prevent accepting transfer twice (double receive)
    pub static TRANSFER_MAP: RefCell<StableBTreeMap<StableTransferId, StableTransfer, Memory>> = with_memory_manager(|memory_manager| {
        RefCell::new(StableBTreeMap::init(memory_manager.get(TRANSFER_MEMORY_ID)))
    });

    // stable memory for storing all claims for users
    pub static CLAIM_MAP: RefCell<StableBTreeMap<StableClaimId, StableClaim, Memory>> = with_memory_manager(|memory_manager| {
        RefCell::new(StableBTreeMap::init(memory_manager.get(CLAIM_MEMORY_ID)))
    });

    // stable memory for storing all LP tokens for users
    pub static LP_TOKEN_LEDGER: RefCell<StableBTreeMap<StableLPTokenLedgerId, StableLPTokenLedger, Memory>> = with_memory_manager(|memory_manager| {
        RefCell::new(StableBTreeMap::init(memory_manager.get(LP_TOKEN_LEDGER_MEMORY_ID)))
    });

    // stable memory for storing all messages
    pub static MESSAGE_MAP: RefCell<StableBTreeMap<StableMessageId, StableMessage, Memory>> = with_memory_manager(|memory_manager| {
        RefCell::new(StableBTreeMap::init(memory_manager.get(MESSAGE_MEMORY_ID)))
    });
}

/// A helper function to access the memory manager.
fn with_memory_manager<R>(f: impl FnOnce(&MemoryManager<DefaultMemoryImpl>) -> R) -> R {
    MEMORY_MANAGER.with(|cell| f(&cell.borrow()))
}
