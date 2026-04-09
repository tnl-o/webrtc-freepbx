# WebRTC FreePBX Phone

A full-featured browser-based SIP softphone that connects to FreePBX via WebRTC (SIP over WSS).

## Architecture

```
Browser ──HTTPS──► Nginx (client)
                       │
                       ├─/api──► Node/Express (server)
                       │              │
                       │           PostgreSQL
                       │
Browser ──WSS──────────────────────► Asterisk (PJSIP)
                                       │
                                    FreePBX (optional)
```

| Service   | Technology                                   |
|-----------|----------------------------------------------|
| client    | React 18 + Vite + JsSIP + Tailwind → Nginx   |
| server    | Node.js 18 + Express + Sequelize             |
| database  | PostgreSQL 15                                |
| asterisk  | Asterisk 20 on Debian bookworm (Docker)      |

---

## Quick Start

### 1. Clone & configure

```bash
git clone https://github.com/tnl-o/webrtc-freepbx.git
cd webrtc-freepbx
cp .env.example .env
```

Edit `.env` and fill in all required fields:

```bash
DB_PASSWORD=<strong-password>
JWT_SECRET=$(openssl rand -hex 64)       # server refuses to start without this

# Your Docker host's LAN IP — not 127.0.0.1 for multi-PC use
# Linux: hostname -I | awk '{print $1}'
# macOS: ipconfig getifaddr en0
ASTERISK_EXTERNAL_IP=192.168.1.50        # ← replace with your real LAN IP

FRONTEND_ORIGIN=http://192.168.1.50      # or https:// if you add TLS certs

SIP_PASSWORD_1001=<strong-sip-password>
SIP_PASSWORD_1002=<strong-sip-password>
SIP_PASSWORD_1003=<strong-sip-password>
```

### 2. Build and run

```bash
docker compose up --build -d
```

The full stack starts: **postgres → server → client (Nginx) + asterisk**.

| Service | URL |
|---------|-----|
| Web app | `http://192.168.1.50` (or port 443 with TLS) |
| SIP WS  | `ws://192.168.1.50:8088/ws` |
| SIP WSS | `wss://192.168.1.50:8089/ws` |

> **Browser ↔ HTTPS / WSS rule:** Modern browsers block mixed content.
> If the web app is served over **HTTPS**, SIP must use **wss://** (port 8089).
> If served over **HTTP**, SIP may use **ws://** (port 8088).
> The three built-in extensions (1001–1003) are pre-configured for WSS.

### 3. First login

Default admin credentials (created automatically on first run with a **random password**):

| Field    | Value      |
|----------|-----------|
| Login    | `admin`    |
| Password | *(see Docker logs for generated password)* |

**Change the admin password immediately after first login.**

---

## Connecting Users to Extensions

### Built-in Asterisk (docker compose)

Three test extensions are ready out-of-the-box: **1001, 1002, 1003**.
Passwords come from `.env` variables `SIP_PASSWORD_1001–1003`.

After `docker compose up`:

1. Log in as **admin** → `/admin/users` → create a regular user
2. Go to `/admin/spaces` → create a Space:

   | Field | Value |
   |-------|-------|
   | User | *(select the user)* |
   | Extension | `1001` |
   | SIP Password | *(same as `SIP_PASSWORD_1001` in .env)* |
   | FreePBX WSS URL | `wss://192.168.1.50:8089/ws` |

3. The user logs in → SIP registration starts automatically → status shows **Connected**.

> **Dialplan:** Extensions dial each other via the `_1XXX` pattern in `extensions.conf`.
> Special codes: `*43` = echo test, `*99` = audio playback test.

### Using an existing FreePBX server

1. In FreePBX: **Connectivity → Asterisk SIP Settings → PJSIP** → enable WebSocket on port 8089 (WSS) → Apply Config
2. Create a PJSIP extension with **Enable WebRTC = Yes**, **DTLS-SRTP = Yes**
3. Open port `8089/tcp` and RTP range `10000–20000/udp` in the firewall
4. In Space config set `pbxWssUrl = wss://<freepbx-ip>:8089/ws`

---

## Admin Panel

| Route | Description |
|-------|-------------|
| `/admin/users` | Create / delete users, change passwords |
| `/admin/spaces` | Manage SIP spaces and assign them to users |

---

## API Reference

### Auth
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/login` | — | Login, sets httpOnly JWT cookie |
| GET | `/api/auth/me` | ✓ | Current user + SIP config |
| POST | `/api/auth/logout` | ✓ | Clears cookie |

### Admin – Users
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/users` | List all users |
| POST | `/api/admin/users` | Create user |
| PATCH | `/api/admin/users/:id/password` | Change password |
| DELETE | `/api/admin/users/:id` | Delete user |

### Admin – Spaces
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/spaces` | List all spaces |
| POST | `/api/admin/spaces` | Create space |
| PUT | `/api/admin/spaces/:id` | Update space |
| DELETE | `/api/admin/spaces/:id` | Delete space |

---

## Development (without Docker)

### Backend

```bash
cd server
cp ../.env.example .env   # edit DB_HOST=localhost
npm install
npm run dev               # nodemon, port 3000
```

### Frontend

```bash
cd client
npm install
npm run dev               # Vite dev server, port 5173
                          # /api proxied to http://localhost:3000
```

---

## HTTPS / Production

For production with a real domain and TLS certificate:

1. Place your certificate in Nginx or behind a reverse proxy (Caddy, Traefik, etc.)
2. Set `COOKIE_SECURE=true` in `.env`
3. Set `FRONTEND_ORIGIN=https://phone.example.com`
4. FreePBX WSS URL must use `wss://` (required by browsers for mixed-content rules)

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Status stays "Connecting…" after login | Wrong WSS URL or port blocked | Check `pbxWssUrl` in Space; open port 8089 in firewall |
| `Failed: Connection Error` | WebSocket not reachable | Check `ASTERISK_EXTERNAL_IP` is real LAN IP, not 127.0.0.1 |
| `Failed: 401` | Wrong SIP password | SIP password in Space must match `SIP_PASSWORD_100x` in `.env` |
| Status shows "Connected" but call fails | Context mismatch or dialplan | Verify `context = from-webrtc` in `pjsip.conf`; check Asterisk logs |
| Audio one-way or no audio | RTP ports not exposed | Ensure ports `10000–10100/udp` are mapped in docker-compose and not firewalled |
| Mixed content browser error | HTTPS page + `ws://` URL | Use `wss://` for SIP URL when frontend is on HTTPS |
| Status disappears on page refresh (old bug) | Fixed: refetchMe() after login | Upgrade to latest commit |

**Useful commands:**
```bash
# Asterisk CLI inside container
docker exec -it webrtc_asterisk asterisk -r

# Check registered peers
asterisk -r -x "pjsip show endpoints"
asterisk -r -x "pjsip show registrations"

# Live call log
docker logs -f webrtc_asterisk

# Server logs
docker logs -f webrtc_server
```

Check browser console (F12 → Console) for detailed JsSIP events.

---

## License

MIT
