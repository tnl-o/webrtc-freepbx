#!/bin/bash
set -euo pipefail

KEYS_DIR="/etc/asterisk/keys"
PEM_FILE="${KEYS_DIR}/asterisk.pem"
KEY_FILE="${KEYS_DIR}/asterisk.key"
CRT_FILE="${KEYS_DIR}/asterisk.crt"

# ── 1. Create runtime directories ────────────────────────────────────────────
mkdir -p "${KEYS_DIR}" \
         /var/run/asterisk \
         /var/spool/asterisk/tmp \
         /var/lib/asterisk

# ── 2. Generate self-signed DTLS/TLS certificate if missing ──────────────────
if [ ! -f "${PEM_FILE}" ]; then
  echo "[entrypoint] Generating self-signed DTLS/TLS certificate…"
  openssl req -new -newkey rsa:2048 -days 3650 -nodes -x509 \
    -subj "/C=US/O=Asterisk/CN=asterisk.local" \
    -keyout "${KEY_FILE}" \
    -out "${CRT_FILE}" 2>/dev/null
  # PEM = key + cert concatenated — format required by Asterisk
  cat "${KEY_FILE}" "${CRT_FILE}" > "${PEM_FILE}"
  chmod 640 "${KEY_FILE}" "${PEM_FILE}"
  echo "[entrypoint] Certificate generated."
else
  echo "[entrypoint] Certificate already exists — skipping generation."
fi

# ── 3. Substitute env variables into pjsip.conf ──────────────────────────────
export ASTERISK_EXTERNAL_IP="${ASTERISK_EXTERNAL_IP:-127.0.0.1}"
export SIP_PASSWORD_1001="${SIP_PASSWORD_1001:-WebRTC1001!}"
export SIP_PASSWORD_1002="${SIP_PASSWORD_1002:-WebRTC1002!}"
export SIP_PASSWORD_1003="${SIP_PASSWORD_1003:-WebRTC1003!}"

echo "[entrypoint] Writing pjsip.conf (external IP: ${ASTERISK_EXTERNAL_IP})…"
envsubst '${ASTERISK_EXTERNAL_IP} ${SIP_PASSWORD_1001} ${SIP_PASSWORD_1002} ${SIP_PASSWORD_1003}' \
  < /etc/asterisk/pjsip.conf.tmpl \
  > /etc/asterisk/pjsip.conf

# ── 4. Clean up stale PID file ───────────────────────────────────────────────
rm -f /var/run/asterisk/asterisk.pid

# ── 5. Start Asterisk in foreground ──────────────────────────────────────────
echo "[entrypoint] Starting Asterisk…"
exec asterisk -f -C /etc/asterisk/asterisk.conf
