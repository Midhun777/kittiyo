# Kittiyo? (കിട്ടിയോ?) — Temporary Text & Link Sharing

> *"Send it. Get a code."*

**Kittiyo?** (Malayalam for *"Did you get it?"*) is a minimal, temporary text and link sharing utility. It solves a classic student and developer problem:

You are on your phone and need to send a snippet of code, command, or link to a college lab computer without:
- Emailing yourself
- Logging into WhatsApp or Telegram on public machines
- Logging into personal Google Drives or cloud accounts
- Installing browser extensions or native applications
- Creating accounts

The flow takes under 10 seconds:
```text
Paste on phone → Get 4-digit code → Enter code on lab PC → Kittiyo? (You got it!)
```

---

## ✨ Features

- **Temporary sharing**: Text or URLs automatically expire after **10 minutes**.
- **4-Digit codes**: Secure random codes (`0000`–`9999`) using cryptographically secure randomness (`crypto.getRandomValues`).
- **Zero accounts**: No sign-ups, no profiles, no passwords, no history tracked.
- **Smart URL detection**: Automatically classifies valid HTTP/HTTPS URLs vs text snippets.
- **Strict security & privacy**:
  - No artificial text/content size limit.
  - Safe URL handling (only `http://` and `https://`; dangerous protocols like `javascript:`, `data:`, `file:` are blocked).
  - Plain text rendering (safe against XSS / HTML injection).
  - IP-based rate limiting on both creation and retrieval to prevent brute force.
  - Never logs shared content.
  - Opportunistic database cleanup on every request.
- **Minimal "Lab Notebook" design**: Warm paper background, crisp ink typography, subtle hand-drawn touches, and keyboard-first accessible UI with auto-advancing 4-digit inputs and paste support.

---

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4
- **Backend / Edge**: Cloudflare Workers, TypeScript
- **Database**: Cloudflare D1 (SQLite at the edge)
- **Deployment**: Integrated Cloudflare Vite & Workers build

---

## 📁 Project Structure

```text
kittiyo/
├── src/
│   ├── components/
│   │   ├── Header.tsx         # Logo, Malayalam badge, mode switcher
│   │   ├── SendView.tsx       # Hero textarea, type detection, generate button
│   │   ├── ReceiveView.tsx    # 4-digit auto-advancing inputs with paste support
│   │   ├── CodeDisplay.tsx    # Prominent 4-digit code, live timer, copy action
│   │   ├── ShareResult.tsx    # Safe text/link viewer with one-click copy/open
│   │   └── Toast.tsx          # Accessible feedback notifications
│   ├── lib/
│   │   ├── api.ts             # Typed API client with error handling
│   │   └── validation.ts      # URL detection, code validation, countdown formatting
│   ├── App.tsx                # Central state machine & view router
│   ├── main.tsx               # React mount entry
│   └── index.css              # Paper styling, typography, focus rings
│
├── worker/
│   └── index.ts               # Cloudflare Worker API & D1 handler
│
├── migrations/
│   └── 0001_initial.sql       # D1 database schema & rate limits
│
├── public/
│   └── favicon.svg            # Custom phone → PC arrow brand mark
│
├── wrangler.jsonc             # Cloudflare Workers & D1 configuration
├── vite.config.ts             # Vite + Tailwind + Cloudflare plugin config
├── tsconfig.json              # Strict TypeScript config
└── package.json
```

---

## 💻 Local Development Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer; v20+ recommended)
- npm (v9+)

### 2. Install dependencies
```bash
npm install
```

### 3. Initialize local D1 database
Apply the SQLite migration to your local Miniflare environment:
```bash
npm run db:migrate:local
```

### 4. Start local development server
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🚀 Cloudflare Production Deployment

Kittiyo is built to deploy on Cloudflare's free tier using **Cloudflare Workers** + **Cloudflare D1**.

Follow these straightforward steps:

### Step 1: Log in to Cloudflare via Wrangler
```bash
npx wrangler login
```
A browser window will open to authenticate your Cloudflare account.

### Step 2: Create your production D1 database
```bash
npx wrangler d1 create kittiyo-db
```
Wrangler will output something like:
```text
[[d1_databases]]
binding = "DB"
database_name = "kittiyo-db"
database_id = "xxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### Step 3: Update `wrangler.jsonc`
Open `wrangler.jsonc` and replace the `database_id` value with your newly generated production `database_id`:
```jsonc
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "kittiyo-db",
      "database_id": "YOUR_ACTUAL_DATABASE_ID_HERE"
    }
  ]
```

### Step 4: Run the database migration on Cloudflare
Execute the schema migration on your remote production D1 database:
```bash
npm run db:migrate:prod
```

### Step 5: Build and Deploy
```bash
npm run build
npm run deploy
```

Once deployment completes, Wrangler will print your live URL:
```text
https://kittiyo.<your-subdomain>.workers.dev
```

---

## 🛡️ API Endpoints

### `POST /api/share`
Creates a temporary share.
- **Body**: `{ "content": "https://github.com", "contentType": "url" }`
- **Response**: `{ "code": "4827", "expiresAt": 1791460000 }`

### `POST /api/retrieve`
Retrieves a share using the 4-digit code.
- **Body**: `{ "code": "4827" }`
- **Response**: `{ "content": "https://github.com", "contentType": "url", "expiresAt": 1791460000 }`

### `GET /api/health`
Health check status.
- **Response**: `{ "status": "ok" }`

---

## 📝 Philosophy: Less, But Better

No user tracking. No unnecessary dashboards. Just the purest:
**Paste → Code → Retrieve**.
