#!/bin/bash

set -euo pipefail

./prepare.sh --output-file data/ingest.jsonld && \
  ./valeros.mjs prepare --input-file data/ingest.jsonld --output-dir data/ingest && \
  ./valeros.mjs ingest --input-dir data/ingest
