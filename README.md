# PFT Analytics

Real-time analytics dashboard for the Post Fiat Network, displaying on-chain metrics from XRPL.

![Dashboard Screenshot](docs/dashboard-screenshot.png)

## Features

- **Network Overview**: Total PFT distributed, unique earners, rewards paid, task submissions, active submitters
- **Derived Metrics**: Average reward size, submission success rate, average earnings per participant
- **Top Earners Leaderboard**: Ranked list with XRPL explorer links
- **Daily Activity Chart**: 14-day PFT distribution visualization
- **Most Active Submitters**: Ranked by submission count
- **Address Search**: Find any address with rank indicator
- **Interactive Addresses**: Click to copy, hover for full address, link to explorer

## Tech Stack

- **Frontend**: Vite + TypeScript + Vanilla JS
- **Data**: Python XRPL scanner via WebSocket RPC
- **Chain**: XRPL Testnet (Post Fiat fork)

## Network Stats (as of Jan 31, 2026)

| Metric | Value |
|--------|-------|
| Total PFT Distributed | 486,286.25 |
| Unique Earners | 18 |
| Rewards Paid | 114 |
| Task Submissions | 360 |
| Active Submitters | 30 |
| Success Rate | 31.7% |
| **Treasury Balance** | **278,453,161 PFT** |

## TaskNode Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     TREASURY/MEMO WALLET                     │
│            rwdm72S9YVKkZjeADKU2bbUMuY4vPnSfH7               │
│                   Balance: 278M+ PFT                         │
│                                                              │
│  - Receives task submission pointers (pf.ptr memos)          │
│  - Funds the reward hot wallet as needed                     │
└──────────────────────────┬──────────────────────────────────┘
                           │ Funding transfers
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     REWARD HOT WALLET                        │
│            rGBKxoTcavpfEso7ASRELZAMcCMqKa8oFk               │
│                   Balance: ~9,000 PFT                        │
│                                                              │
│  - Distributes PFT rewards to task completers                │
│  - Gets topped up from treasury                              │
└──────────────────────────┬──────────────────────────────────┘
                           │ Reward payments
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      TASK COMPLETERS                         │
│                    (18 unique earners)                       │
│                                                              │
│  - Receive PFT for verified task completions                 │
│  - Top earner: 113,375 PFT                                   │
└─────────────────────────────────────────────────────────────┘
```

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Refresh network data
python3 scripts/scan_network.py --output public/data/network.json
```

## Data Sources

All data is sourced directly from the XRPL chain via WebSocket RPC at `wss://rpc.testnet.postfiat.org:6007`.

The scanner queries:
1. Reward wallet (`account_tx`) - outgoing PFT payments to participants
2. Memo wallet (`account_tx`) - incoming task submission pointers (pf.ptr memos)

## License

MIT
