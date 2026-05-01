#!/bin/bash

# The distributions to prepare for ingestion into the search index

# Universiteitsmuseum Utrecht
DISTRIBUTION1=(
 "https://collections.uu.nl/datadump_28-03-2026.jsonld.gz"
 "queries/collections-uu.rq"
)

# KB, nationale bibliotheek
DISTRIBUTION2=(
  "https://data.bibliotheken.nl/KB/Production/download.ttl.gz?graph=http%3A%2F%2Fdata.bibliotheken.nl%2Frise-alba"
  "queries/alba-amicorum-kb.rq"
)

# Limburgs Museum
DISTRIBUTION3=(
  "https://www.ldmax.nl/datasets/Q2798268/collectie/resources/collectie.nq.gz"
  "queries/collectie-limburgs-museum.rq"
)

DISTRIBUTIONS=(
  DISTRIBUTION1[@]
  DISTRIBUTION2[@]
  DISTRIBUTION3[@]
)
