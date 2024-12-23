#!/usr/bin/env bash

NETWORK="--network ic"
IDENTITY="--identity kong"

./switch_staging.sh

dfx build ${NETWORK} ${IDENTITY} kong_backend
dfx canister install ${NETWORK} ${IDENTITY} kong_backend --mode upgrade

dfx build ${NETWORK} ${IDENTITY} kong_faucet
dfx canister install ${NETWORK} ${IDENTITY} kong_faucet --mode upgrade
