#!/usr/bin/env bash

# Ensure we exit with failure if anything here fails
set -e

INITIAL_FOLDER=`pwd`

# cd into the codebase, as per CI source
cd code
mkdir reports

# Install xdebug & disable
yarn install
make test coverage

cd ${INITIAL_FOLDER}

