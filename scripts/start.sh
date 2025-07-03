#!/bin/sh
set -euo pipefail

echo "Applying database migrations"

npx prisma migrate deploy

echo "Starting application"

npm exec react-router-serve ./build/server/index.js
