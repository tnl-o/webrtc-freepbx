#!/bin/sh
set -e

KEYS_DIR="/etc/asterisk/keys"
PEM_FILE="${KEYS_DIR}/asterisk.pem"

mkdir -p "${KEYS_DIR}"

if [ ! -f "${PEM_FILE}" ]; then
    echo "[entrypoint] Generating self-signed DTLS/TLS certificate..."
    openssl req -new -newkey rsa:2048 -days 3650 -nodes -x509 \
        -subj "/C=US/ST=Local/L=Local/O=Asterisk/CN=asterisk.local" \
        -keyout "${KEYS_DIR}/asterisk.key" \
        -out "${KEYS_DIR}/asterisk.crt" 2>/dev/null
    cat "${KEYS_DIR}/asterisk.key" "${KEYS_DIR}/asterisk.crt" > "${PEM_FILE}"
    echo "[entrypoint] Certificate generated: ${PEM_FILE}"
else
    echo "[entrypoint] Certificate already exists."
fi

export ASTERISK_EXTERNAL_IP="${ASTERISK_EXTERNAL_IP:-127.0.0.1}"
export SIP_PASSWORD_1001="${SIP_PASSWORD_1001:-SecurePass1001!}"
export SIP_PASSWORD_1002="${SIP_PASSWORD_1002:-SecurePass1002!}"
export SIP_PASSWORD_1003="${SIP_PASSWORD_1003:-SecurePass1003!}"

VARS='${ASTERISK_EXTERNAL_IP} ${SIP_PASSWORD_1001} ${SIP_PASSWORD_1002} ${SIP_PASSWORD_1003}'
echo "[entrypoint] Substituting variables into pjsip.conf..."
envsubst "${VARS}" < /etc/asterisk/pjsip.conf.tmpl > /etc/asterisk/pjsip.conf

echo "[entrypoint] Starting Asterisk..."
exec asterisk -f
