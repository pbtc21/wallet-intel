# Source Code

Main application source for the Wallet Intelligence API.

## Files

### index.ts

Single-file application containing:

- **Hono app configuration** - CORS, routes
- **Frontend HTML** - Embedded responsive UI for browser access
- **Payment logic** - x402 protocol implementation
- **Data fetching** - Parallel API calls to external sources
- **Analysis functions** - Risk scoring, categorization, insights

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Cloudflare Worker                       │
├─────────────────────────────────────────────────────────────┤
│  Hono Router                                                 │
│  ├── GET /           → API info or Frontend HTML            │
│  ├── GET /health     → Health check                         │
│  ├── GET /analyze/:a → Full report (paid)                   │
│  └── GET /quick/:a   → Quick summary (paid)                 │
├─────────────────────────────────────────────────────────────┤
│  Payment Layer (x402)                                        │
│  ├── paymentRequired()  → 402 response with contract info   │
│  └── verifyPayment()    → Validate tx via Hiro API          │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                  │
│  ├── fetchStxPrice()       → CoinGecko / Tenero fallback    │
│  ├── fetchBnsName()        → Hiro API                       │
│  ├── fetchStxBalance()     → Hiro API                       │
│  ├── fetchTokenHoldings()  → Tenero API                     │
│  ├── fetchNFTHoldings()    → Hiro API                       │
│  └── detectDeFiPositions() → Transaction analysis           │
├─────────────────────────────────────────────────────────────┤
│  Analysis Layer                                              │
│  ├── categorizeToken()          → blue-chip/defi/meme/other │
│  ├── calculateRiskScore()       → 0-100 score               │
│  ├── calculatePortfolioHealth() → poor/fair/good/excellent  │
│  ├── calculateActivityLevel()   → inactive to whale         │
│  └── generateInsights()         → Actionable recommendations│
└─────────────────────────────────────────────────────────────┘
```

## Key Constants

### Payment Configuration

```typescript
const CONTRACT = {
  address: 'SPP5ZMH9NQDFD2K5CEQZ6P02AP8YPWMQ75TJW20M',
  name: 'simple-oracle',
  price: 100000,      // 0.1 STX (full report)
  quickPrice: 25000,  // 0.025 STX (quick summary)
  recipient: 'SPP5ZMH9NQDFD2K5CEQZ6P02AP8YPWMQ75TJW20M',
};
```

### Token Categories

| Category | Examples | Risk Weight |
|----------|----------|-------------|
| Blue Chip | STX, sBTC, xBTC, USDA, ALEX, VELAR | Low |
| DeFi | ALEX LP tokens, Arkadiko assets | Medium |
| Meme | WELSH, LEO, PEPE, NOT, DROID | High |
| Other | Everything else | Medium |

### DeFi Protocols Detected

- **ALEX** - Vault, staking, launchpad
- **Velar** - DEX swaps
- **Arkadiko** - DEX, vaults, staking
- **StackingDAO** - Liquid stacking
- **sBTC** - Bitcoin bridge deposits
- **xBTC** - Wrapped Bitcoin

## Types

### WalletReport

The main response type for `/analyze/:address`:

```typescript
interface WalletReport {
  address: string;
  bnsName: string | null;
  timestamp: string;
  summary: {
    totalValueUsd: number;
    stxBalance: number;
    stxPrice: number;
    tokenCount: number;
    nftCount: number;
    defiProtocols: number;
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    activityLevel: 'inactive' | 'low' | 'moderate' | 'high' | 'whale';
    portfolioHealth: 'poor' | 'fair' | 'good' | 'excellent';
  };
  allocation: { stx, blueChip, defi, meme, other };
  tokens: TokenHolding[];
  nfts: NFTHolding[];
  defi: DeFiPosition[];
  recentActivity: { txCount30d, lastActive, topInteractions };
  insights: Insight[];
}
```

## Caching

- **STX Price** - 5-minute TTL in-memory cache
- **Other data** - Fresh on each request (Cloudflare handles edge caching)

## Error Handling

- Invalid addresses return 400
- Payment verification failures return 403
- Missing payment returns 402 with contract details
- External API failures degrade gracefully (return empty arrays/defaults)
