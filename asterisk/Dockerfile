FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

# Asterisk 20 on Debian bookworm — stable, full WebRTC support, no Stasis bug
RUN apt-get update && apt-get install -y --no-install-recommends \
    asterisk \
    asterisk-modules \
    openssl \
    gettext-base \
    && rm -rf /var/lib/apt/lists/*

# Create all required directories upfront
RUN mkdir -p /etc/asterisk/keys \
             /var/log/asterisk \
             /var/spool/asterisk/tmp \
             /var/spool/asterisk/voicemail \
             /var/run/asterisk \
             /var/cache/asterisk \
             /var/lib/asterisk/agi-bin

# Copy config templates
COPY configs/ /etc/asterisk/

# Copy and enable entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 5060/udp
EXPOSE 8088/tcp
EXPOSE 8089/tcp
EXPOSE 10000-10100/udp

ENTRYPOINT ["/entrypoint.sh"]
