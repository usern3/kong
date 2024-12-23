#!/usr/bin/env bash
# this script is used to mint tokens towards a principal id for local testing

if [ -z "$1" ]
	then
		echo "Please provide a principal ID as argument"
		exit 1
fi

NETWORK="--network local"
IDENTITY="--identity kong_token_minter"
TO_PRINCIPAL_ID="$1"

# 100,000 ICP
AMOUNT=10_000_000_000_000
TOKEN="icp"
TOKEN_LEDGER="${TOKEN}_ledger"

dfx canister call ${NETWORK} ${IDENTITY} ${TOKEN_LEDGER} icrc1_transfer "(record {
	to=record {owner=principal \"${TO_PRINCIPAL_ID}\"; subaccount=null};
	amount=${AMOUNT};
},)"

# 1,000,000 ckUSDT
AMOUNT=1_000_000_000_000
TOKEN="ckusdt"
TOKEN_LEDGER="${TOKEN}_ledger"

dfx canister call ${NETWORK} ${IDENTITY} ${TOKEN_LEDGER} icrc1_transfer "(record {
	to=record {owner=principal \"${TO_PRINCIPAL_ID}\"; subaccount=null};
	amount=${AMOUNT};
},)"

# 200,000 ckUSDC
AMOUNT=200_000_000_000
TOKEN="ckusdc"
TOKEN_LEDGER="${TOKEN}_ledger"

dfx canister call ${NETWORK} ${IDENTITY} ${TOKEN_LEDGER} icrc1_transfer "(record {
	to=record {owner=principal \"${TO_PRINCIPAL_ID}\"; subaccount=null};
	amount=${AMOUNT};
},)"

# 5 ckBTC
AMOUNT=500_000_000
TOKEN="ckbtc"
TOKEN_LEDGER="${TOKEN}_ledger"

dfx canister call ${NETWORK} ${IDENTITY} ${TOKEN_LEDGER} icrc1_transfer "(record {
	to=record {owner=principal \"${TO_PRINCIPAL_ID}\"; subaccount=null};
	amount=${AMOUNT};
},)"

# 60 ckETH
AMOUNT=60_000_000_000_000_000_000
TOKEN="cketh"
TOKEN_LEDGER="${TOKEN}_ledger"

dfx canister call ${NETWORK} ${IDENTITY} ${TOKEN_LEDGER} icrc1_transfer "(record {
	to=record {owner=principal \"${TO_PRINCIPAL_ID}\"; subaccount=null};
	amount=${AMOUNT};
},)"

# 5,000,000 KONG
AMOUNT=500_000_000_000_000
TOKEN="kong"
TOKEN_LEDGER="${TOKEN}_ledger"

dfx canister call ${NETWORK} ${IDENTITY} ${TOKEN_LEDGER} icrc1_transfer "(record {
	to=record {owner=principal \"${TO_PRINCIPAL_ID}\"; subaccount=null};
	amount=${AMOUNT};
},)"
