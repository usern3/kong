#!/usr/bin/env bash

if [ -z "$1" ]
	then
		NETWORK=""
		SAME_SUBNET=""
	else
		NETWORK="--network $1"
		SAME_SUBNET="--next-to kong_backend"
fi
IDENTITY="--identity kong"

pnpm --filter kong_frontend i

dfx deploy ${NETWORK} ${IDENTITY} ${SAME_SUBNET} kong_frontend