#!/usr/bin/env sh

# Ensure we exit with failure if anything here fails
set -e

INITIAL_FOLDER=`pwd`

# cd into the codebase, as per CI source
cd code

apk add make
yarn install
make test coverage

cd ${INITIAL_FOLDER}

