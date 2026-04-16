#!/bin/bash

set -euo pipefail

SCRIPTS_DIR=$(cd $(dirname $0) && pwd -P)

source $SCRIPTS_DIR/distributions.sh
source $SCRIPTS_DIR/functions.sh

OUTPUT_FILE=

# Parse command line arguments
while [[ "$#" > 1 ]]; do case $1 in
  --output-file) OUTPUT_FILE="$2";;
  *) break;;
  esac; shift; shift
done

createIngestFile "$OUTPUT_FILE"
