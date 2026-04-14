#!/bin/bash

set -euo pipefail

SCRIPTS_DIR=$(cd $(dirname $0) && pwd -P)

source $SCRIPTS_DIR/functions.sh

URL=
QUERY_FILE=
OUTPUT_FILE=

# Parse command line arguments
while [[ "$#" > 1 ]]; do case $1 in
  --url) URL="$2";;
  --query-file) QUERY_FILE="$2";;
  --output-file) OUTPUT_FILE="$2";;
  *) break;;
  esac; shift; shift
done

prepare "$URL" "$QUERY_FILE" "$OUTPUT_FILE"
