#!/usr/bin/env bash

if ! command -v cargo >/dev/null; then
	echo "Rust/Cargo is not installed"
	exit 1
fi

if ! command -v pnpm >/dev/null; then
	echo "Node.js/pnpm is not installed"
	exit 1
fi

if ! command -v dfx >/dev/null; then
	echo "Dfinity CDK is not installed"
	exit 1
fi

if ! command -v jq >/dev/null; then
	echo "jq is not installed"
	exit 1
fi

USER_LIST=$(dfx identity list 2>&1)
if [[ $USER_LIST != *"kong"* ]] || [[ $USER_LIST != *"kong_token_minter"* ]] || [[ $USER_LIST != *"kong_user1"* ]]; then
	echo "User kong, kong_token_minter or kong_user1 does not exists. run create_identity.sh"
	exit 1
fi

./switch_local.sh

cd ..

dfx identity use kong

./deploy_kong_backend.sh
./deploy_kong_data.sh
./deploy_internet_identity.sh
./deploy_icp_ledger.sh
./deploy_ckusdc_ledger.sh
./deploy_ckusdt_ledger.sh
./deploy_ckbtc_ledger.sh
./deploy_cketh_ledger.sh
./deploy_kong_ledger.sh
./deploy_kong1_ledger.sh
./deploy_kong2_ledger.sh
./deploy_kong_svelte.sh

./user_mint.sh

./deploy_kong_faucet.sh