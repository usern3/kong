export const idlFactory = ({ IDL }) => {
  const TxId = IDL.Variant({
    'TransactionId' : IDL.Text,
    'BlockIndex' : IDL.Nat,
  });
  const AddLiquidityArgs = IDL.Record({
    'token_0' : IDL.Text,
    'token_1' : IDL.Text,
    'amount_0' : IDL.Nat,
    'amount_1' : IDL.Nat,
    'tx_id_0' : IDL.Opt(TxId),
    'tx_id_1' : IDL.Opt(TxId),
  });
  const ICTransferReply = IDL.Record({
    'is_send' : IDL.Bool,
    'block_index' : IDL.Nat,
    'chain' : IDL.Text,
    'canister_id' : IDL.Text,
    'amount' : IDL.Nat,
    'symbol' : IDL.Text,
  });
  const TransferReply = IDL.Variant({ 'IC' : ICTransferReply });
  const TransferIdReply = IDL.Record({
    'transfer_id' : IDL.Nat64,
    'transfer' : TransferReply,
  });
  const AddLiquidityReply = IDL.Record({
    'ts' : IDL.Nat64,
    'request_id' : IDL.Nat64,
    'status' : IDL.Text,
    'tx_id' : IDL.Nat64,
    'add_lp_token_amount' : IDL.Nat,
    'transfer_ids' : IDL.Vec(TransferIdReply),
    'amount_0' : IDL.Nat,
    'amount_1' : IDL.Nat,
    'claim_ids' : IDL.Vec(IDL.Nat64),
    'symbol_0' : IDL.Text,
    'symbol_1' : IDL.Text,
    'chain_0' : IDL.Text,
    'chain_1' : IDL.Text,
    'symbol' : IDL.Text,
  });
  const AddLiquidityResult = IDL.Variant({
    'Ok' : AddLiquidityReply,
    'Err' : IDL.Text,
  });
  const AddLiquidityAmountsReply = IDL.Record({
    'add_lp_token_amount' : IDL.Nat,
    'amount_0' : IDL.Nat,
    'amount_1' : IDL.Nat,
    'address_0' : IDL.Text,
    'address_1' : IDL.Text,
    'symbol_0' : IDL.Text,
    'symbol_1' : IDL.Text,
    'chain_0' : IDL.Text,
    'chain_1' : IDL.Text,
    'symbol' : IDL.Text,
    'fee_0' : IDL.Nat,
    'fee_1' : IDL.Nat,
  });
  const AddLiquiditAmountsResult = IDL.Variant({
    'Ok' : AddLiquidityAmountsReply,
    'Err' : IDL.Text,
  });
  const AddLiquidityAsyncResult = IDL.Variant({
    'Ok' : IDL.Nat64,
    'Err' : IDL.Text,
  });
  const AddPoolArgs = IDL.Record({
    'token_0' : IDL.Text,
    'token_1' : IDL.Text,
    'amount_0' : IDL.Nat,
    'amount_1' : IDL.Nat,
    'tx_id_0' : IDL.Opt(TxId),
    'tx_id_1' : IDL.Opt(TxId),
    'lp_fee_bps' : IDL.Opt(IDL.Nat8),
    'on_kong' : IDL.Opt(IDL.Bool),
  });
  const AddPoolReply = IDL.Record({
    'ts' : IDL.Nat64,
    'request_id' : IDL.Nat64,
    'status' : IDL.Text,
    'tx_id' : IDL.Nat64,
    'lp_token_symbol' : IDL.Text,
    'balance' : IDL.Nat,
    'add_lp_token_amount' : IDL.Nat,
    'transfer_ids' : IDL.Vec(TransferIdReply),
    'amount_0' : IDL.Nat,
    'amount_1' : IDL.Nat,
    'claim_ids' : IDL.Vec(IDL.Nat64),
    'symbol_0' : IDL.Text,
    'symbol_1' : IDL.Text,
    'chain_0' : IDL.Text,
    'chain_1' : IDL.Text,
    'lp_token_supply' : IDL.Nat,
    'symbol' : IDL.Text,
    'lp_fee_bps' : IDL.Nat8,
    'on_kong' : IDL.Bool,
  });
  const AddPoolResult = IDL.Variant({ 'Ok' : AddPoolReply, 'Err' : IDL.Text });
  const AddTokenArgs = IDL.Record({
    'token' : IDL.Text,
    'on_kong' : IDL.Opt(IDL.Bool),
  });
  const ICTokenReply = IDL.Record({
    'fee' : IDL.Nat,
    'decimals' : IDL.Nat8,
    'token' : IDL.Text,
    'token_id' : IDL.Nat32,
    'chain' : IDL.Text,
    'name' : IDL.Text,
    'canister_id' : IDL.Text,
    'icrc1' : IDL.Bool,
    'icrc2' : IDL.Bool,
    'icrc3' : IDL.Bool,
    'pool_symbol' : IDL.Text,
    'symbol' : IDL.Text,
    'on_kong' : IDL.Bool,
  });
  const AddTokenReply = IDL.Variant({ 'IC' : ICTokenReply });
  const AddTokenResult = IDL.Variant({
    'Ok' : AddTokenReply,
    'Err' : IDL.Text,
  });
  const PoolExpectedBalance = IDL.Record({
    'balance' : IDL.Nat,
    'kong_fee' : IDL.Nat,
    'pool_symbol' : IDL.Text,
    'lp_fee' : IDL.Nat,
  });
  const ExpectedBalance = IDL.Record({
    'balance' : IDL.Nat,
    'pool_balances' : IDL.Vec(PoolExpectedBalance),
    'unclaimed_claims' : IDL.Nat,
  });
  const CheckPoolsReply = IDL.Record({
    'expected_balance' : ExpectedBalance,
    'diff_balance' : IDL.Int,
    'actual_balance' : IDL.Nat,
    'symbol' : IDL.Text,
  });
  const CheckPoolsResult = IDL.Variant({
    'Ok' : IDL.Vec(CheckPoolsReply),
    'Err' : IDL.Text,
  });
  const SwapArgs = IDL.Record({
    'receive_token' : IDL.Text,
    'max_slippage' : IDL.Opt(IDL.Float64),
    'pay_amount' : IDL.Nat,
    'referred_by' : IDL.Opt(IDL.Text),
    'receive_amount' : IDL.Opt(IDL.Nat),
    'receive_address' : IDL.Opt(IDL.Text),
    'pay_token' : IDL.Text,
    'pay_tx_id' : IDL.Opt(TxId),
  });
  const RemoveLiquidityArgs = IDL.Record({
    'token_0' : IDL.Text,
    'token_1' : IDL.Text,
    'remove_lp_token_amount' : IDL.Nat,
  });
  const RequestRequest = IDL.Variant({
    'AddLiquidity' : AddLiquidityArgs,
    'Swap' : SwapArgs,
    'AddPool' : AddPoolArgs,
    'RemoveLiquidity' : RemoveLiquidityArgs,
  });
  const SwapTxReply = IDL.Record({
    'ts' : IDL.Nat64,
    'receive_chain' : IDL.Text,
    'pay_amount' : IDL.Nat,
    'receive_amount' : IDL.Nat,
    'pay_symbol' : IDL.Text,
    'receive_symbol' : IDL.Text,
    'pool_symbol' : IDL.Text,
    'price' : IDL.Float64,
    'pay_chain' : IDL.Text,
    'lp_fee' : IDL.Nat,
    'gas_fee' : IDL.Nat,
  });
  const SwapReply = IDL.Record({
    'ts' : IDL.Nat64,
    'txs' : IDL.Vec(SwapTxReply),
    'request_id' : IDL.Nat64,
    'status' : IDL.Text,
    'tx_id' : IDL.Nat64,
    'transfer_ids' : IDL.Vec(TransferIdReply),
    'receive_chain' : IDL.Text,
    'mid_price' : IDL.Float64,
    'pay_amount' : IDL.Nat,
    'receive_amount' : IDL.Nat,
    'claim_ids' : IDL.Vec(IDL.Nat64),
    'pay_symbol' : IDL.Text,
    'receive_symbol' : IDL.Text,
    'price' : IDL.Float64,
    'pay_chain' : IDL.Text,
    'slippage' : IDL.Float64,
  });
  const RemoveLiquidityReply = IDL.Record({
    'ts' : IDL.Nat64,
    'request_id' : IDL.Nat64,
    'status' : IDL.Text,
    'tx_id' : IDL.Nat64,
    'transfer_ids' : IDL.Vec(TransferIdReply),
    'lp_fee_0' : IDL.Nat,
    'lp_fee_1' : IDL.Nat,
    'amount_0' : IDL.Nat,
    'amount_1' : IDL.Nat,
    'claim_ids' : IDL.Vec(IDL.Nat64),
    'symbol_0' : IDL.Text,
    'symbol_1' : IDL.Text,
    'chain_0' : IDL.Text,
    'chain_1' : IDL.Text,
    'remove_lp_token_amount' : IDL.Nat,
    'symbol' : IDL.Text,
  });
  const RequestReply = IDL.Variant({
    'AddLiquidity' : AddLiquidityReply,
    'Swap' : SwapReply,
    'AddPool' : AddPoolReply,
    'RemoveLiquidity' : RemoveLiquidityReply,
    'Pending' : IDL.Null,
  });
  const RequestsReply = IDL.Record({
    'ts' : IDL.Nat64,
    'request_id' : IDL.Nat64,
    'request' : RequestRequest,
    'statuses' : IDL.Vec(IDL.Text),
    'reply' : RequestReply,
  });
  const RequestsResult = IDL.Variant({
    'Ok' : IDL.Vec(RequestsReply),
    'Err' : IDL.Text,
  });
  const TransfersResult = IDL.Variant({
    'Ok' : IDL.Vec(TransferIdReply),
    'Err' : IDL.Text,
  });
  const TxsReply = IDL.Variant({
    'AddLiquidity' : AddLiquidityReply,
    'Swap' : SwapReply,
    'AddPool' : AddPoolReply,
    'RemoveLiquidity' : RemoveLiquidityReply,
  });
  const TxsResult = IDL.Variant({ 'Ok' : IDL.Vec(TxsReply), 'Err' : IDL.Text });
  const UserReply = IDL.Record({
    'account_id' : IDL.Text,
    'user_name' : IDL.Text,
    'fee_level_expires_at' : IDL.Opt(IDL.Nat64),
    'referred_by' : IDL.Opt(IDL.Text),
    'user_id' : IDL.Nat32,
    'fee_level' : IDL.Nat8,
    'principal_id' : IDL.Text,
    'referred_by_expires_at' : IDL.Opt(IDL.Nat64),
    'campaign1_flags' : IDL.Vec(IDL.Bool),
    'my_referral_code' : IDL.Text,
  });
  const UserResult = IDL.Variant({ 'Ok' : UserReply, 'Err' : IDL.Text });
  const Icrc28TrustedOriginsResponse = IDL.Record({
    'trusted_origins' : IDL.Vec(IDL.Text),
  });
  const MessagesReply = IDL.Record({
    'ts' : IDL.Nat64,
    'title' : IDL.Text,
    'message' : IDL.Text,
    'message_id' : IDL.Nat64,
  });
  const MessagesResult = IDL.Variant({
    'Ok' : IDL.Vec(MessagesReply),
    'Err' : IDL.Text,
  });
  const PoolReply = IDL.Record({
    'lp_token_symbol' : IDL.Text,
    'balance' : IDL.Nat,
    'total_lp_fee' : IDL.Nat,
    'name' : IDL.Text,
    'lp_fee_0' : IDL.Nat,
    'lp_fee_1' : IDL.Nat,
    'balance_0' : IDL.Nat,
    'balance_1' : IDL.Nat,
    'rolling_24h_volume' : IDL.Nat,
    'rolling_24h_apy' : IDL.Float64,
    'address_0' : IDL.Text,
    'address_1' : IDL.Text,
    'rolling_24h_num_swaps' : IDL.Nat,
    'symbol_0' : IDL.Text,
    'symbol_1' : IDL.Text,
    'total_volume' : IDL.Nat,
    'pool_id' : IDL.Nat32,
    'price' : IDL.Float64,
    'chain_0' : IDL.Text,
    'chain_1' : IDL.Text,
    'lp_token_supply' : IDL.Nat,
    'symbol' : IDL.Text,
    'rolling_24h_lp_fee' : IDL.Nat,
    'lp_fee_bps' : IDL.Nat8,
    'on_kong' : IDL.Bool,
  });
  const PoolsReply = IDL.Record({
    'total_24h_lp_fee' : IDL.Nat,
    'total_tvl' : IDL.Nat,
    'total_24h_volume' : IDL.Nat,
    'pools' : IDL.Vec(PoolReply),
    'total_24h_num_swaps' : IDL.Nat,
  });
  const PoolsResult = IDL.Variant({ 'Ok' : PoolsReply, 'Err' : IDL.Text });
  const RemoveLiquidityResult = IDL.Variant({
    'Ok' : RemoveLiquidityReply,
    'Err' : IDL.Text,
  });
  const RemoveLiquidityAmountsReply = IDL.Record({
    'lp_fee_0' : IDL.Nat,
    'lp_fee_1' : IDL.Nat,
    'amount_0' : IDL.Nat,
    'amount_1' : IDL.Nat,
    'address_0' : IDL.Text,
    'address_1' : IDL.Text,
    'symbol_0' : IDL.Text,
    'symbol_1' : IDL.Text,
    'chain_0' : IDL.Text,
    'chain_1' : IDL.Text,
    'remove_lp_token_amount' : IDL.Nat,
    'symbol' : IDL.Text,
  });
  const RemoveLiquidityAmountsResult = IDL.Variant({
    'Ok' : RemoveLiquidityAmountsReply,
    'Err' : IDL.Text,
  });
  const RemoveLiquidityAsyncResult = IDL.Variant({
    'Ok' : IDL.Nat64,
    'Err' : IDL.Text,
  });
  const SendArgs = IDL.Record({
    'token' : IDL.Text,
    'to_address' : IDL.Text,
    'amount' : IDL.Nat,
  });
  const SendReply = IDL.Record({
    'ts' : IDL.Nat64,
    'request_id' : IDL.Nat64,
    'status' : IDL.Text,
    'tx_id' : IDL.Nat64,
    'chain' : IDL.Text,
    'to_address' : IDL.Text,
    'amount' : IDL.Nat,
    'symbol' : IDL.Text,
  });
  const SendResult = IDL.Variant({ 'OK' : SendReply, 'Err' : IDL.Text });
  const SwapResult = IDL.Variant({ 'Ok' : SwapReply, 'Err' : IDL.Text });
  const SwapAmountsTxReply = IDL.Record({
    'receive_chain' : IDL.Text,
    'pay_amount' : IDL.Nat,
    'receive_amount' : IDL.Nat,
    'pay_symbol' : IDL.Text,
    'receive_symbol' : IDL.Text,
    'receive_address' : IDL.Text,
    'pool_symbol' : IDL.Text,
    'pay_address' : IDL.Text,
    'price' : IDL.Float64,
    'pay_chain' : IDL.Text,
    'lp_fee' : IDL.Nat,
    'gas_fee' : IDL.Nat,
  });
  const SwapAmountsReply = IDL.Record({
    'txs' : IDL.Vec(SwapAmountsTxReply),
    'receive_chain' : IDL.Text,
    'mid_price' : IDL.Float64,
    'pay_amount' : IDL.Nat,
    'receive_amount' : IDL.Nat,
    'pay_symbol' : IDL.Text,
    'receive_symbol' : IDL.Text,
    'receive_address' : IDL.Text,
    'pay_address' : IDL.Text,
    'price' : IDL.Float64,
    'pay_chain' : IDL.Text,
    'slippage' : IDL.Float64,
  });
  const SwapAmountsResult = IDL.Variant({
    'Ok' : SwapAmountsReply,
    'Err' : IDL.Text,
  });
  const SwapAsyncResult = IDL.Variant({ 'Ok' : IDL.Nat64, 'Err' : IDL.Text });
  const LPTokenReply = IDL.Record({
    'fee' : IDL.Nat,
    'decimals' : IDL.Nat8,
    'token' : IDL.Text,
    'token_id' : IDL.Nat32,
    'chain' : IDL.Text,
    'name' : IDL.Text,
    'address' : IDL.Text,
    'pool_id_of' : IDL.Nat32,
    'pool_symbol' : IDL.Text,
    'total_supply' : IDL.Nat,
    'symbol' : IDL.Text,
    'on_kong' : IDL.Bool,
  });
  const TokenReply = IDL.Variant({ 'IC' : ICTokenReply, 'LP' : LPTokenReply });
  const TokensResult = IDL.Variant({
    'Ok' : IDL.Vec(TokenReply),
    'Err' : IDL.Text,
  });
  const BalancesReply = IDL.Record({
    'ts' : IDL.Nat64,
    'usd_balance' : IDL.Float64,
    'balance' : IDL.Float64,
    'name' : IDL.Text,
    'amount_0' : IDL.Float64,
    'amount_1' : IDL.Float64,
    'symbol_0' : IDL.Text,
    'symbol_1' : IDL.Text,
    'usd_amount_0' : IDL.Float64,
    'usd_amount_1' : IDL.Float64,
    'symbol' : IDL.Text,
  });
  const UserBalancesReply = IDL.Variant({ 'LP' : BalancesReply });
  const UserBalancesResult = IDL.Variant({
    'Ok' : IDL.Vec(UserBalancesReply),
    'Err' : IDL.Text,
  });
  const ValidateAddLiquidityResult = IDL.Variant({
    'Ok' : IDL.Text,
    'Err' : IDL.Text,
  });
  const ValidateRemoveLiquidityResult = IDL.Variant({
    'Ok' : IDL.Text,
    'Err' : IDL.Text,
  });
  return IDL.Service({
    'add_liquidity' : IDL.Func([AddLiquidityArgs], [AddLiquidityResult], []),
    'add_liquidity_amounts' : IDL.Func(
        [IDL.Text, IDL.Nat, IDL.Text],
        [AddLiquiditAmountsResult],
        ['query'],
      ),
    'add_liquidity_async' : IDL.Func(
        [AddLiquidityArgs],
        [AddLiquidityAsyncResult],
        [],
      ),
    'add_pool' : IDL.Func([AddPoolArgs], [AddPoolResult], []),
    'add_token' : IDL.Func([AddTokenArgs], [AddTokenResult], []),
    'check_pools' : IDL.Func([], [CheckPoolsResult], []),
    'get_requests' : IDL.Func(
        [IDL.Opt(IDL.Nat64), IDL.Opt(IDL.Nat32)],
        [RequestsResult],
        ['query'],
      ),
    'get_transfers' : IDL.Func(
        [IDL.Opt(IDL.Nat64)],
        [TransfersResult],
        ['query'],
      ),
    'get_txs' : IDL.Func(
        [IDL.Opt(IDL.Nat64), IDL.Opt(IDL.Nat32)],
        [TxsResult],
        ['query'],
      ),
    'get_user' : IDL.Func([], [UserResult], ['query']),
    'icrc1_name' : IDL.Func([], [IDL.Text], ['query']),
    'icrc28_trusted_origins' : IDL.Func([], [Icrc28TrustedOriginsResponse], []),
    'messages' : IDL.Func([IDL.Opt(IDL.Nat64)], [MessagesResult], ['query']),
    'pools' : IDL.Func([IDL.Opt(IDL.Text)], [PoolsResult], ['query']),
    'remove_liquidity' : IDL.Func(
        [RemoveLiquidityArgs],
        [RemoveLiquidityResult],
        [],
      ),
    'remove_liquidity_amounts' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Nat],
        [RemoveLiquidityAmountsResult],
        ['query'],
      ),
    'remove_liquidity_async' : IDL.Func(
        [RemoveLiquidityArgs],
        [RemoveLiquidityAsyncResult],
        [],
      ),
    'requests' : IDL.Func([IDL.Opt(IDL.Nat64)], [RequestsResult], ['query']),
    'send' : IDL.Func([SendArgs], [SendResult], []),
    'swap' : IDL.Func([SwapArgs], [SwapResult], []),
    'swap_amounts' : IDL.Func(
        [IDL.Text, IDL.Nat, IDL.Text],
        [SwapAmountsResult],
        ['query'],
      ),
    'swap_async' : IDL.Func([SwapArgs], [SwapAsyncResult], []),
    'tokens' : IDL.Func([IDL.Opt(IDL.Text)], [TokensResult], ['query']),
    'txs' : IDL.Func([IDL.Opt(IDL.Bool)], [TxsResult], ['query']),
    'user_balances' : IDL.Func(
        [IDL.Opt(IDL.Text)],
        [UserBalancesResult],
        ['query'],
      ),
    'validate_add_liquidity' : IDL.Func([], [ValidateAddLiquidityResult], []),
    'validate_remove_liquidity' : IDL.Func(
        [],
        [ValidateRemoveLiquidityResult],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
