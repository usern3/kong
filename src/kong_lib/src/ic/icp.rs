pub const ICP_TOKEN_ID: u32 = 2;
pub const ICP_SYMBOL: &str = "ICP";
pub const ICP_SYMBOL_WITH_CHAIN: &str = "IC.ICP";
#[cfg(not(feature = "prod"))]
pub const ICP_ADDRESS: &str = "nppha-riaaa-aaaal-ajf2q-cai";
#[cfg(not(feature = "prod"))]
pub const ICP_ADDRESS_WITH_CHAIN: &str = "IC.nppha-riaaa-aaaal-ajf2q-cai";
#[cfg(feature = "prod")]
pub const ICP_ADDRESS: &str = "ryjl3-tyaaa-aaaaa-aaaba-cai";
#[cfg(feature = "prod")]
pub const ICP_ADDRESS_WITH_CHAIN: &str = "IC.ryjl3-tyaaa-aaaaa-aaaba-cai";
