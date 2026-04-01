#!/bin/sh
set -e

echo "Running database migrations..."
NODE_ENV=production node node_modules/typeorm/cli.js migration:run -d dist/ormconfig.js

echo "Starting application..."
exec node dist/src/main.js
