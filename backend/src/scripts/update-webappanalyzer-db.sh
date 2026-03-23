#!/usr/bin/env bash
set -euo pipefail

# Always run relative to repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../" && pwd)"

DEST_ROOT="${REPO_ROOT}/data/vendor/webappanalyzer"
DEST_SRC="${DEST_ROOT}/src"

OWNER="enthec"
REPO="webappanalyzer"
BRANCH="main"

TMP_DIR="$(mktemp -d)"
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

echo "==> Repo root: ${REPO_ROOT}"
echo "==> Updating into: ${DEST_SRC}"

echo "==> Fetching latest commit SHA for ${OWNER}/${REPO}@${BRANCH}..."
SHA="$(curl -fsSL "https://api.github.com/repos/${OWNER}/${REPO}/commits/${BRANCH}" | \
  python -c "import sys,json; print(json.load(sys.stdin)['sha'])")"

echo "==> Downloading archive for ${SHA}..."
curl -fsSL -o "${TMP_DIR}/repo.zip" \
  "https://github.com/${OWNER}/${REPO}/archive/${SHA}.zip"

echo "==> Extracting..."
unzip -q "${TMP_DIR}/repo.zip" -d "${TMP_DIR}"
SRC_DIR="$(find "${TMP_DIR}" -maxdepth 1 -type d -name "${REPO}-*" | head -n 1)/src"

if [[ ! -f "${SRC_DIR}/categories.json" || ! -f "${SRC_DIR}/groups.json" || ! -d "${SRC_DIR}/technologies" ]]; then
  echo "ERROR: Upstream structure changed. Expected src/categories.json, src/groups.json, src/technologies/"
  exit 1
fi

echo "==> Updating local dataset..."
mkdir -p "${DEST_SRC}"
rm -rf "${DEST_SRC}/technologies"
mkdir -p "${DEST_SRC}/technologies"

cp "${SRC_DIR}/categories.json" "${DEST_SRC}/categories.json"
cp "${SRC_DIR}/groups.json" "${DEST_SRC}/groups.json"
cp -R "${SRC_DIR}/technologies/." "${DEST_SRC}/technologies/"

echo "${SHA}" > "${DEST_ROOT}/UPSTREAM_SHA.txt"
date -u +"%Y-%m-%dT%H:%M:%SZ" > "${DEST_ROOT}/LAST_UPDATED_UTC.txt"

echo "==> Done."
echo "    Updated from ${OWNER}/${REPO}@${SHA}"