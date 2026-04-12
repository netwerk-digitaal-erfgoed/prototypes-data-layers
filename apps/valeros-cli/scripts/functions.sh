#!/bin/bash

set -euo pipefail

fetch() {
  local url="$1"
  local outputFile="$2"

  echo "Downloading, validating and converting '$url'"

  baseFileName=$(basename "$url")

  wget -q $url -O "/tmp/$baseFileName"

  # Test for gzip
  if gzip -t "/tmp/$baseFileName" 2>/dev/null; then
    gunzip -f "/tmp/$baseFileName"  # Removes the .gz suffix automatically
    baseFileName="${baseFileName%.*}" # Remove the *last* dot‑extension, i.e. `.gz`
  fi

  extension="${outputFile##*.}" # E.g. `nq`

  # Validate and convert the distribution
  riot --output $extension "/tmp/$baseFileName" > "$outputFile"
}

map() {
  local inputFile="$1"
  local queryFile="$2"
  local outputFile="$3"

  echo "Mapping data in '$inputFile' to '$outputFile' according to '$queryFile'"

  # Remove existing file, if any
  rm -f $outputFile

  extension="${outputFile##*.}" # E.g. `ttl`

  sparql --data "$inputFile" --query "$queryFile" --results $extension > "$outputFile"
}

convert() {
  local inputFile="$1"
  local outputFile="$2"

  echo "Transforming data in '$inputFile' to '$outputFile'"

  # Remove existing file, if any
  rm -f $outputFile

  extension="${outputFile##*.}" # E.g. `jsonld`

  riot --output $extension "$inputFile" > "$outputFile"
}

prepare() {
  local url="$1"
  local queryFile="$2"
  local outputFile="$3"
  local startTime=$SECONDS

  echo "Preparing data from '$url'"

  outputDirName=$(dirname "$outputFile")
  outputBaseFileName=$(basename "$outputFile")

  nquadsFile="$outputFile.nq"
  turtleFile="$outputFile.ttl"

  # Optimization for testing: do not fetch again if the file already exists
  if [[ ! -e "$nquadsFile" ]]; then
    fetch "$url" "$nquadsFile"
  fi

  map "$nquadsFile" "$queryFile" "$turtleFile"
  convert "$turtleFile" "$outputFile"

  rm -f "$turtleFile"

  local endTime=$SECONDS
  local duration=$((endTime-startTime))

  echo "Done preparing in $duration seconds"
}
