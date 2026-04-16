#!/bin/bash

fetch() {
  local url="$1"
  local outputFile="$2"

  echo "Downloading, validating and converting '$url'"

  # Strip everything from '?' onward. Example:
  # https://data.bibliotheken.nl/KB/Production/download.ttl.gz?graph=http%3A%2F%2Fdata.bibliotheken.nl%2Frise-alba
  local baseFileName=$(basename "${url%%\?*}")

  wget -q $url -O "/tmp/$baseFileName"

  # Test for gzip
  if gzip -t "/tmp/$baseFileName" 2>/dev/null; then
    gunzip -f "/tmp/$baseFileName"  # Removes the .gz suffix automatically
    baseFileName="${baseFileName%.*}" # Remove the *last* dot‑extension, i.e. `.gz`
  fi

  local outputExtension="${outputFile##*.}" # E.g. `nq`

  # Validate and convert the distribution
  riot --output $outputExtension "/tmp/$baseFileName" > "$outputFile"
}

map() {
  local inputFile="$1"
  local queryFile="$2"
  local outputFile="$3"

  echo "Mapping data in '$inputFile' to '$outputFile' according to '$queryFile'"

  # Remove existing file, if any
  rm -f $outputFile

  local outputExtension="${outputFile##*.}" # E.g. `ttl`

  sparql --data "$inputFile" --query "$queryFile" --results $outputExtension > "$outputFile"
}

prepare() {
  local url="$1"
  local queryFile="$2"
  local outputFile="$3"
  local startTime=$SECONDS

  echo "Preparing data from '$url'"

  local outputDirName=$(dirname "$outputFile")

  mkdir -p $outputDirName

  local nquadsFile="$outputFile.nq"

  # Optimization for testing: do not fetch again if the file already exists
  if [[ ! -e "$nquadsFile" ]]; then
    fetch "$url" "$nquadsFile"
  fi

  map "$nquadsFile" "$queryFile" "$outputFile"

  local endTime=$SECONDS
  local duration=$((endTime-startTime))

  echo "Prepared data from '$url' in $duration seconds"
}

createIngestFile() {
  local mainOutputFile="$1" # E.g. `/path/to/ingest.jsonld`

  # Remove existing file, if any
  rm -f $mainOutputFile
  local outputDir=$(dirname $mainOutputFile)
  mkdir -p $outputDir

  # Make sure no files from a previous run exist
  local dataDir="/tmp/prepare"
  rm -rf $dataDir
  mkdir -p $dataDir

  # Convert each distribution to Turtle
  for distribution in "${DISTRIBUTIONS[@]}"; do
    local elements=("${!distribution}") # Get the elements of the distribution
    local url=${elements[0]}
    local queryFile=${elements[1]}

    # Random file name, e.g. `20240415_112233_ab12cd.ttl`
    local outputFile=$(mktemp "${dataDir}/$(date +%Y%m%d_%H%M%S)_XXXXXX.ttl")

    prepare "$url" "$queryFile" "$outputFile"
  done

  # Combine the different output files into one - fast, cheap
  local turtleOutputFile="/tmp/main.ttl"
  cat ${dataDir}/*.ttl > "${turtleOutputFile}"

  local outputExtension="${mainOutputFile##*.}" # E.g. `jsonld`

  # Convert Turtle to output format
  riot --output $outputExtension "${turtleOutputFile}" > "${mainOutputFile}"
}
