#!/bin/bash
export PATH=$PATH:/usr/bin:/bin:/usr/local/bin

# 1. Load Config
SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
CONFIG_FILE="$SCRIPT_DIR/../../workspace/okx_data/config.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Config file not found at $CONFIG_FILE"
    exit 1
fi

API_KEY=$(jq -r '.apiKey' "$CONFIG_FILE")
SECRET=$(jq -r '.secretKey' "$CONFIG_FILE")
PASSPHRASE=$(jq -r '.passphrase' "$CONFIG_FILE")
IS_SIM=$(jq -r '.isSimulation' "$CONFIG_FILE")

# 2. Define Helper Functions
generate_signature() {
  local timestamp="$1"
  local method="$2"
  local path="$3"
  local body="$4"
  local sign_string="${timestamp}${method}${path}${body}"
  echo -n "$sign_string" | openssl dgst -sha256 -hmac "$SECRET" -binary | base64
}

# 3. Prepare Request
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
METHOD="GET"
PATH="/api/v5/account/balance?ccy=USDT"
SIGNATURE=$(generate_signature "$TIMESTAMP" "$METHOD" "$PATH" "")

# 4. Set Simulation Header
SIM_HEADER="0"
if [ "$IS_SIM" == "true" ]; then
    SIM_HEADER="1"
fi

# 5. Execute Curl
echo "Querying OKX Balance (Sim: $IS_SIM)..."
curl -s "https://www.okx.com${PATH}" \
  -H "OK-ACCESS-KEY: ${API_KEY}" \
  -H "OK-ACCESS-SIGN: ${SIGNATURE}" \
  -H "OK-ACCESS-TIMESTAMP: ${TIMESTAMP}" \
  -H "OK-ACCESS-PASSPHRASE: ${PASSPHRASE}" \
  -H "x-simulated-trading: ${SIM_HEADER}" \
  | jq '.data[0].details[] | {ccy: .ccy, cashBal: .cashBal, availBal: .availBal, eq: .eq}'
