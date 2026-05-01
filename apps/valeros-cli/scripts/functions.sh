#!/bin/bash

fetch() {
  local url="$1"
  local outputFile="$2"

  echo "Downloading and converting '$url' to '$outputFile'"

  local outputDirName=$(dirname "$outputFile")
  mkdir -p $outputDirName

  # Strip everything from '?' onward. Example:
  # https://data.bibliotheken.nl/KB/Production/download.ttl.gz?graph=http%3A%2F%2Fdata.bibliotheken.nl%2Frise-alba
  local baseFileName=$(basename "${url%%\?*}")
  local tempOutputFile="$outputDirName/$baseFileName"

  # Download the distribution
  wget -q $url -O "$tempOutputFile"

  # Test for gzip
  if gzip -t "$tempOutputFile" 2>/dev/null; then
    gunzip -f "$tempOutputFile"  # Removes the .gz suffix automatically
    baseFileName="${baseFileName%.*}" # Remove the *last* dot‑extension, i.e. `.gz`
  fi

  local outputExtension="${outputFile##*.}" # E.g. `nq`

  # Convert the distribution
  riot --merge --output $outputExtension "$outputDirName/$baseFileName" > "$outputFile"
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

  # Random file name, e.g. `ab12cd.nt`.
  # Discard quads, if any, by using N-Triples
  local ntriplesFile=$(mktemp "${outputDirName}/XXXXXX.nt")

  fetch "$url" "$ntriplesFile"

  map "$ntriplesFile" "$queryFile" "$outputFile"

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

  local prepareDir="$outputDir/prepare"
  mkdir -p $prepareDir

  # Convert each distribution to Turtle
  for distribution in "${DISTRIBUTIONS[@]}"; do
    local elements=("${!distribution}") # Get the elements of the distribution
    local url=${elements[0]}
    local queryFile=${elements[1]}

    # Random file name, e.g. `main_ab12cd.ttl`
    local outputFile=$(mktemp "${prepareDir}/main_XXXXXX.ttl")

    prepare "$url" "$queryFile" "$outputFile"
  done

  # Combine the different `main_` output files into one - fast, cheap
  local tempMainOutputFile="$prepareDir/main.ttl"
  cat ${prepareDir}/main_*.ttl > "${tempMainOutputFile}"

  local outputExtension="${mainOutputFile##*.}" # E.g. `jsonld`

  # Convert Turtle to output format
  riot --output $outputExtension "${tempMainOutputFile}" > "${mainOutputFile}"

  # Remove all temporary work files
  rm -rf $prepareDir
}
