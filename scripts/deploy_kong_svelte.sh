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

npm -w kong_svelte i

dfx deploy ${NETWORK} ${IDENTITY} ${SAME_SUBNET} kong_svelte