#!/bin/bash

# Define a list of distributions to prepare for ingestion into the search engine

DISTRIBUTION1=(
 "https://collections.uu.nl/datadump_28-03-2026.jsonld.gz"
 "queries/collections-uu.rq"
)

DISTRIBUTION2=(
  "https://data.bibliotheken.nl/KB/Production/download.ttl.gz?graph=http%3A%2F%2Fdata.bibliotheken.nl%2Frise-alba"
  "queries/alba-amicorum-kb.rq"
)

DISTRIBUTIONS=(
  DISTRIBUTION1[@]
  DISTRIBUTION2[@]
)
