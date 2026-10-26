#!/usr/bin/env bash
set -e

# ==============================================================================
# Script Pemulihan (Rollback) Database PostgreSQL - personalBlog
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_FILE="${SCRIPT_DIR}/../db/personalBlog_dump_20261026.sql"
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="admin"
DB_NAME="personalBlog"
export PGPASSWORD="Admin*123"

echo "=========================================================="
echo "  Memulai Rollback Database PostgreSQL: ${DB_NAME}"
echo "=========================================================="

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: Berkas backup tidak ditemukan di: ${BACKUP_FILE}"
  exit 1
fi

echo ">> Memulihkan basis data dari ${BACKUP_FILE}..."
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -f "${BACKUP_FILE}" > /dev/null 2>&1

echo ">> Verifikasi pemulihan tabel..."
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "\dt"

echo "=========================================================="
echo "  Pemulihan Database BERHASIL!"
echo "=========================================================="
