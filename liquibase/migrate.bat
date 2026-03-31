@echo off
REM Frisol v2 — Database Migrations via Liquibase
REM Usage:
REM   migrate.bat              — apply all pending migrations
REM   migrate.bat status       — show migration status
REM   migrate.bat rollback     — rollback last changeset
REM   migrate.bat history      — show applied changesets

set ACTION=%1
if "%ACTION%"=="" set ACTION=update

docker run --rm --network host ^
  -v "%cd%\changelog:/liquibase/changelog" ^
  -v "%cd%\lib:/liquibase/lib" ^
  liquibase/liquibase:latest ^
  --url=jdbc:mysql://127.0.0.1:3306/frisol ^
  --username=frisol ^
  --password=frisol ^
  --changeLogFile=db.changelog-master.xml ^
  %ACTION%
