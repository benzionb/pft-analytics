# PFT Task Node Analytics

Real-time on-chain analytics dashboard for the Post Fiat network.

**[Live Dashboard → pft.w.ai](https://pft.w.ai)**

## Features

- **Real-time Data** — Updates every minute via automated on-chain scanning
- **Network Metrics** — Total PFT distributed, unique earners, task rewards, success rate
- **Leaderboard** — Top earners ranked by balance with gold/silver/bronze styling
- **Explorer Integration** — Click any address or ledger to view on [Post Fiat Explorer](https://explorer.testnet.postfiat.org)
- **Daily Distribution** — 14-day UTC visualization of PFT rewards activity
- **Wallet Search** — Find any address with instant rank and earnings lookup

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | [Vite](https://vitejs.dev/) + TypeScript (vanilla, no framework) |
| Hosting | [Vercel](https://vercel.com/) (Serverless + Cron + Blob) |
| Blockchain | Post Fiat L1 (XRPL fork) via WebSocket RPC |
| Explorer | [explorer.testnet.postfiat.org](https://explorer.testnet.postfiat.org) |

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

The dashboard will be available at `http://localhost:5173`.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        VERCEL CRON                               │
│                    (every minute)                                │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SERVERLESS FUNCTION                            │
│                  /api/refresh-data.ts                            │
│                                                                  │
│   1. Connect to Post Fiat RPC via WebSocket                      │
│   2. Fetch transactions from all reward wallets                  │
│   3. Compute leaderboard, totals, daily activity                 │
│   4. Write JSON to Vercel Blob                                   │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      VERCEL BLOB                                 │
│                    network.json                                  │
│                                                                  │
│   Public URL with 60s cache + stale-while-revalidate             │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                       FRONTEND                                   │
│                     Vite + TypeScript                            │
│                                                                  │
│   Static site fetches from Blob URL on load + 60s auto-refresh   │
└─────────────────────────────────────────────────────────────────┘
```

### Data Sources

All data is sourced directly from the Post Fiat chain via WebSocket RPC (`wss://rpc.testnet.postfiat.org:6007`):

| Wallet Type | Address | Purpose |
|-------------|---------|---------|
| Reward Wallet (Primary) | `rGBKxoTcavpfEso7ASRELZAMcCMqKa8oFk` | Main PFT reward distribution |
| Reward Wallet (Secondary) | `rKt4peDozpRW9zdYGiTZC54DSNU3Af6pQE` | Additional reward distribution |
| Reward Wallet | `rJNwqDPKSkbqDPNoNxbW6C3KCS84ZaQc96` | Additional reward distribution |
| Reward Relay | `rKddMw1hqMGwfgJvzjbWQHtBQT8hDcZNCP` | Memo-funded reward relay |
| Memo Wallet | `rwdm72S9YVKkZjeADKU2bbUMuY4vPnSfH7` | Receives task submission pointers (pf.ptr) |

## Project Structure

```
pft-analytics/
├── api/
│   └── refresh-data.ts    # Vercel serverless function (cron job)
├── src/
│   ├── main.ts            # Frontend entry point, dashboard rendering
│   ├── api.ts             # Data fetching utilities
│   └── style.css          # Terminal-style CSS theme
├── scripts/               # Debug/analysis scripts
├── vercel.json            # Vercel config (cron schedule, headers)
└── index.html             # HTML template with Agentation loader (localhost only)
```

## Key Files

| File | Purpose |
|------|---------|
| `api/refresh-data.ts` | Serverless function that scans chain and writes to Blob |
| `src/main.ts` | Dashboard rendering, search, explorer links |
| `src/style.css` | Terminal aesthetic (black bg, green text, glow effects) |
| `vercel.json` | Cron schedule (every minute), cache headers |

## Deployment

### Vercel (Recommended)

1. Fork this repository
2. Import to Vercel
3. Add environment variables:
   - `CRON_SECRET` — Optional secret to protect the cron endpoint
   - `BLOB_READ_WRITE_TOKEN` — Vercel Blob storage token (auto-configured)
4. Deploy

The cron job will automatically run every minute to refresh data.

### Local Development

```bash
# Frontend only (uses production Blob data)
npm run dev

# With serverless functions (for testing refresh)
npm i -g vercel
vercel dev
```

## Metrics Explained

| Metric | Description |
|--------|-------------|
| **Total PFT Paid** | Sum of all PFT distributed from reward wallets |
| **Unique Earners** | Count of distinct addresses that received rewards |
| **Tasks Rewarded** | Number of reward transactions sent |
| **Submissions** | Count of `pf.ptr` memo transactions to memo wallet |
| **Success Rate** | Tasks Rewarded / Submissions × 100 |
| **Avg Reward** | Total PFT Paid / Tasks Rewarded |

## Contributing

Contributions welcome! The codebase is intentionally simple — vanilla TypeScript, no heavy frameworks.

### Ideas

- [ ] Historical data export (CSV)
- [ ] WebSocket live updates (replace polling)
- [ ] Per-wallet task history view
- [ ] Network health indicators

## For AI Agents

See [CLAUDE.md](CLAUDE.md) for project context and development patterns.

## License

MIT — see [LICENSE](LICENSE) for details.

---

Built for the [Post Fiat Network](https://postfiat.org/) • [Explorer](https://explorer.testnet.postfiat.org)
