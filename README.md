# Wallet Intelligence API

Deep analysis of any Stacks wallet - holdings, DeFi positions, risk assessment, and actionable insights.

## Overview

A Cloudflare Worker API that provides comprehensive wallet intelligence for the Stacks blockchain. Payment-gated via x402 protocol for sustainable API economics.

## Features

- **Portfolio Valuation** - Real-time USD values across all tokens using live STX price
- **BNS Resolution** - Automatic name lookup for Stacks addresses
- **DeFi Detection** - Identifies positions in ALEX, Velar, Arkadiko, StackingDAO
- **NFT Inventory** - Holdings grouped by collection
- **Risk Scoring** - 0-100 score with low/medium/high levels
- **Actionable Insights** - Opportunities, warnings, and recommendations

## Stack

| Component | Technology |
|-----------|------------|
| Runtime | Bun |
| Framework | Hono |
| Platform | Cloudflare Workers |
| Language | TypeScript |

## Endpoints

### Paid Endpoints

| Endpoint | Price | Description |
|----------|-------|-------------|
| `GET /analyze/:address` | 0.1 STX | Full wallet intelligence report |
| `GET /quick/:address` | 0.025 STX | Quick portfolio summary |

### Free Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | API info (JSON) or frontend (HTML) |
| `GET /health` | Health check |

## Payment Flow (x402)

1. Request paid endpoint without payment header
2. Receive 402 response with payment contract details
3. Call `SPP5ZMH9NQDFD2K5CEQZ6P02AP8YPWMQ75TJW20M.simple-oracle` with STX
4. Retry request with `X-Payment: <txid>` header
5. Receive full response

## Data Sources

- **Hiro API** - Balances, transactions, NFTs, BNS
- **Tenero API** - Token holdings with USD valuations
- **CoinGecko** - STX price (primary)

## Development

```bash
# Install dependencies
bun install

# Run locally
bun run wrangler dev

# Deploy
bun run wrangler deploy
```

## Project Structure

```
wallet-intel/
├── src/
│   └── index.ts      # Main application (API + frontend)
├── package.json      # Dependencies
├── wrangler.toml     # Cloudflare Worker config
├── tsconfig.json     # TypeScript config
└── CLAUDE.md         # Bun-specific instructions
```

## Response Examples

### Quick Summary Response

```json
{
  "address": "SP...",
  "bnsName": "satoshi.btc",
  "summary": {
    "totalValueUsd": "$1,234.56",
    "stxBalance": "500.00 STX",
    "tokenCount": 8,
    "topHoldings": [...]
  }
}
```

### Full Report Response

```json
{
  "address": "SP...",
  "bnsName": "satoshi.btc",
  "summary": {
    "totalValueUsd": 1234.56,
    "stxBalance": 500,
    "riskScore": 35,
    "riskLevel": "medium",
    "activityLevel": "moderate",
    "portfolioHealth": "good"
  },
  "allocation": {
    "stx": 0.40,
    "blueChip": 0.35,
    "defi": 0.15,
    "meme": 0.05,
    "other": 0.05
  },
  "tokens": [...],
  "nfts": [...],
  "defi": [...],
  "insights": [...]
}
```

## Risk Scoring

The risk score (0-100) considers:

- **Meme token exposure** (0-40 points) - High volatility assets
- **Concentration risk** (0-30 points) - Single asset dominance
- **Diversification** (0-20 points) - Number of holdings
- **Volatility** (0-10 points) - 24h price changes

| Score Range | Level |
|-------------|-------|
| 0-29 | Low |
| 30-59 | Medium |
| 60-100 | High |

## Insight Types

- **info** - Informational observations
- **warning** - Potential concerns
- **opportunity** - Yield/optimization suggestions
- **risk** - Risk alerts requiring attention

## License

Private - Part of the pbtc21.dev ecosystem
