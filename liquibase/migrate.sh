#!/bin/bash
# Frisol v2 — Database Migrations via Liquibase
# Usage:
#   ./migrate.sh              — apply all pending migrations
#   ./migrate.sh status       — show migration status
#   ./migrate.sh rollback     — rollback last changeset
#   ./migrate.sh history      — show applied changesets

set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

ACTION="${1:-update}"

docker run --rm --network host \
  -v "$PWD/changelog:/liquibase/changelog" \
  -v "$PWD/lib:/liquibase/lib" \
  liquibase/liquibase:latest \
  --url=jdbc:mysql://127.0.0.1:3306/frisol \
  --username=frisol \
  --password=frisol \
  --changeLogFile=db.changelog-master.xml \
  $ACTION
