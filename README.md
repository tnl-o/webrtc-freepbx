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
Browser ──WSS──────────────────────► FreePBX PJSIP
```

| Service  | Technology                     |
|----------|-------------------------------|
| client   | React 18 + Vite + JsSIP + Tailwind → Nginx |
| server   | Node.js 18 + Express + Sequelize |
| database | PostgreSQL 15                  |

---

## Quick Start

### 1. Clone & configure

```bash
git clone https://github.com/tnl-o/webrtc-freepbx.git
cd webrtc-freepbx
cp .env.example .env
```

Edit `.env` and set at minimum:
- `DB_PASSWORD` — strong database password
- `JWT_SECRET` — random 64-char hex string (`openssl rand -hex 64`)
- `FRONTEND_ORIGIN` — URL where the app will be served (e.g. `https://phone.example.com`)

### 2. Build and run

```bash
docker compose up --build -d
```

The app will be available at `http://localhost` (or the port configured in `CLIENT_PORT`).

### 3. First login

Default admin credentials (created automatically on first run):

| Field    | Value      |
|----------|-----------|
| Login    | `admin`    |
| Password | `admin123` |

**Change the admin password immediately after first login.**

---

## FreePBX Configuration

### Step 1 — Enable PJSIP WebSocket Transport

1. **Admin → Advanced Settings**
   - Set *Allow Anonymous Inbound SIP Calls* → **No**

2. **Connectivity → Asterisk SIP Settings → PJSIP tab**
   - Scroll to *WebSocket Settings*
   - Enable: **Enable WebSocket** ✓
   - TLS: if you have a certificate, enable **Enable WSS**; otherwise use WS on port 8088
   - Recommended production settings:
     - Port: `8089` (WSS) or `8088` (WS)
     - Bind: `0.0.0.0`

3. Click **Submit** → **Apply Config**

### Step 2 — Create a WebRTC Extension

1. **Applications → Extensions → Add Extension → Add PJSIP Extension**
2. Fill in:
   | Field | Value |
   |-------|-------|
   | User Extension | e.g. `1001` |
   | Display Name | User's name |
   | Secret | Strong SIP password |
3. Navigate to the **Advanced** tab:
   | Setting | Value |
   |---------|-------|
   | Enable WebRTC | **Yes** |
   | Transport | **WSS** (or WS if no TLS) |
   | DTLS-SRTP | **Yes** (required for WebRTC) |
4. **Submit** → **Apply Config**

### Step 3 — Firewall / Network

- Open port `8089` (WSS) or `8088` (WS) to the browser clients
- If FreePBX is behind NAT, configure **NAT Settings** in Asterisk SIP Settings:
  - External Address: your public IP
  - Local Networks: your LAN CIDR (e.g. `192.168.1.0/24`)
- Enable the RTP port range (default `10000–20000`) in the firewall

### Step 4 — Add Space in the Admin Panel

1. Log in as admin at `http://your-server/admin/spaces`
2. Create a space:
   | Field | Example |
   |-------|---------|
   | User | (select the user) |
   | Extension | `1001` |
   | SIP Password | (the secret from Step 2) |
   | FreePBX WSS URL | `wss://pbx.example.com:8089/ws` |

The user will automatically register when they log in.

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

| Symptom | Likely cause |
|---------|-------------|
| Status stays "Registering" | FreePBX WSS port unreachable or wrong URL |
| `Failed: Connection Error` | WebSocket blocked by firewall or wrong port |
| Audio one-way | RTP ports not open or NAT misconfigured |
| `401 Unauthorized` from SIP | Wrong SIP password in Space config |
| Browser blocks WSS | Page served over HTTP but WSS URL uses `wss://` — use `ws://` for HTTP or add TLS |

Check browser console (F12 → Console) for detailed JsSIP logs.

---

## License

MIT
