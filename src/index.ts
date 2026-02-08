/**
 * Wallet Intelligence API
 * Deep analysis of any Stacks wallet - holdings, DeFi positions, risk score, insights
 * x402 payment-gated endpoint
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();
app.use('*', cors());

// Frontend HTML
function getFrontendHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wallet Intelligence | Deep Stacks Wallet Analysis</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --bg: #0a0a0f;
      --surface: #12121a;
      --surface-2: #1a1a25;
      --border: #2a2a3a;
      --text: #e4e4e7;
      --text-muted: #71717a;
      --accent: #06b6d4;
      --accent-2: #22d3ee;
      --green: #22c55e;
      --orange: #f97316;
      --blue: #3b82f6;
      --red: #ef4444;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      min-height: 100vh;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 3rem 1.5rem;
    }

    header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--surface);
      border: 1px solid var(--border);
      padding: 0.5rem 1rem;
      border-radius: 2rem;
      font-size: 0.85rem;
      color: var(--accent-2);
      margin-bottom: 1.5rem;
    }

    h1 {
      font-size: 2.75rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--text) 0%, var(--accent-2) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 1rem;
    }

    .subtitle {
      font-size: 1.15rem;
      color: var(--text-muted);
      max-width: 550px;
      margin: 0 auto;
    }

    .search-section {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 2rem;
      margin-bottom: 2rem;
    }

    .search-box {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    input[type="text"] {
      flex: 1;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.9rem;
      padding: 1rem 1.25rem;
      border-radius: 0.5rem;
      border: 1px solid var(--border);
      background: var(--surface-2);
      color: var(--text);
      outline: none;
      transition: border-color 0.2s;
    }

    input[type="text"]:focus {
      border-color: var(--accent);
    }

    input[type="text"]::placeholder {
      color: var(--text-muted);
    }

    button {
      font-family: inherit;
      font-size: 0.9rem;
      font-weight: 500;
      padding: 1rem 2rem;
      border-radius: 0.5rem;
      border: none;
      background: var(--accent);
      color: #000;
      cursor: pointer;
      transition: all 0.2s;
    }

    button:hover { background: var(--accent-2); }
    button:disabled { opacity: 0.5; cursor: not-allowed; }

    .search-hint {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .feature {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      padding: 1.25rem;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .feature-icon {
      font-size: 1.5rem;
      line-height: 1;
    }

    .feature h3 {
      font-size: 0.95rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .feature p {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .pricing {
      background: linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 2rem;
      margin-bottom: 2rem;
    }

    .pricing h2 {
      font-size: 1.25rem;
      margin-bottom: 1rem;
    }

    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .pricing-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      padding: 1.5rem;
      text-align: center;
    }

    .pricing-card h3 {
      font-size: 1rem;
      margin-bottom: 0.5rem;
    }

    .price {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--accent-2);
      margin-bottom: 0.5rem;
    }

    .price-unit {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .result-section {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 2rem;
      margin-bottom: 2rem;
      display: none;
    }

    .result-section.visible { display: block; }

    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .wallet-address {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .bns-name {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--accent-2);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat {
      background: var(--surface-2);
      border-radius: 0.5rem;
      padding: 1rem;
      text-align: center;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text);
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .risk-low { color: var(--green); }
    .risk-medium { color: var(--orange); }
    .risk-high { color: var(--red); }

    .insights-list {
      margin-top: 1.5rem;
    }

    .insight {
      background: var(--surface-2);
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 0.75rem;
      border-left: 3px solid var(--border);
    }

    .insight.info { border-left-color: var(--blue); }
    .insight.warning { border-left-color: var(--orange); }
    .insight.opportunity { border-left-color: var(--green); }
    .insight.risk { border-left-color: var(--red); }

    .insight-title {
      font-weight: 600;
      font-size: 0.9rem;
      margin-bottom: 0.25rem;
    }

    .insight-desc {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .insight-action {
      font-size: 0.8rem;
      color: var(--accent-2);
      margin-top: 0.5rem;
    }

    footer {
      text-align: center;
      padding-top: 2rem;
      border-top: 1px solid var(--border);
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    footer a {
      color: var(--accent-2);
      text-decoration: none;
    }

    .loading {
      text-align: center;
      padding: 2rem;
      color: var(--text-muted);
    }

    @media (max-width: 640px) {
      h1 { font-size: 2rem; }
      .container { padding: 2rem 1rem; }
      .search-box { flex-direction: column; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="badge">
        <span>Wallet Intel</span>
        <span>•</span>
        <span>x402 Powered</span>
      </div>
      <h1>Wallet Intelligence</h1>
      <p class="subtitle">Deep analysis of any Stacks wallet. Holdings, DeFi positions, risk assessment, and actionable insights.</p>
    </header>

    <div class="search-section">
      <div class="search-box">
        <input type="text" id="address-input" placeholder="SP... or SM... address" />
        <button onclick="analyzeWallet()">Analyze</button>
      </div>
      <p class="search-hint">Enter a Stacks address to get a free preview. Full report requires x402 payment.</p>
    </div>

    <div class="features">
      <div class="feature">
        <span class="feature-icon">💰</span>
        <div>
          <h3>Portfolio Value</h3>
          <p>Real-time USD valuations across all tokens</p>
        </div>
      </div>
      <div class="feature">
        <span class="feature-icon">📊</span>
        <div>
          <h3>Risk Score</h3>
          <p>0-100 risk assessment with level rating</p>
        </div>
      </div>
      <div class="feature">
        <span class="feature-icon">🔗</span>
        <div>
          <h3>DeFi Detection</h3>
          <p>ALEX, Velar, Arkadiko, StackingDAO</p>
        </div>
      </div>
      <div class="feature">
        <span class="feature-icon">💡</span>
        <div>
          <h3>Insights</h3>
          <p>Actionable opportunities and warnings</p>
        </div>
      </div>
    </div>

    <div class="pricing">
      <h2>Pricing</h2>
      <div class="pricing-grid">
        <div class="pricing-card">
          <h3>Quick Summary</h3>
          <div class="price">0.025 STX</div>
          <div class="price-unit">Basic overview</div>
        </div>
        <div class="pricing-card">
          <h3>Full Report</h3>
          <div class="price">0.1 STX</div>
          <div class="price-unit">Complete analysis</div>
        </div>
      </div>
    </div>

    <div id="result-section" class="result-section">
      <div class="result-header">
        <div>
          <div id="bns-name" class="bns-name"></div>
          <div id="wallet-address" class="wallet-address"></div>
        </div>
      </div>
      <div id="stats-grid" class="stats-grid"></div>
      <div id="insights-list" class="insights-list"></div>
    </div>

    <footer>
      <p>Part of the <a href="https://pbtc21.dev">pbtc21.dev</a> ecosystem</p>
      <p style="margin-top: 0.5rem;">Powered by Stacks • x402 Protocol</p>
    </footer>
  </div>

  <script>
    async function analyzeWallet() {
      const address = document.getElementById('address-input').value.trim();
      if (!address || (!address.startsWith('SP') && !address.startsWith('SM'))) {
        alert('Please enter a valid Stacks address');
        return;
      }

      const resultSection = document.getElementById('result-section');
      resultSection.className = 'result-section visible';
      resultSection.innerHTML = '<div class="loading">Analyzing wallet...</div>';

      try {
        // Try quick endpoint (will return 402 but shows the concept)
        const res = await fetch('/quick/' + address);

        if (res.status === 402) {
          const payment = await res.json();
          resultSection.innerHTML = \`
            <div class="result-header">
              <div>
                <div class="wallet-address">\${address}</div>
              </div>
            </div>
            <div style="text-align: center; padding: 2rem;">
              <h3 style="margin-bottom: 1rem;">Payment Required</h3>
              <p style="color: var(--text-muted); margin-bottom: 1rem;">Full analysis requires \${payment.payment.price / 1000000} STX</p>
              <p style="font-size: 0.85rem; color: var(--text-muted);">
                1. Call <code style="background: var(--surface-2); padding: 0.2rem 0.5rem; border-radius: 0.25rem;">\${payment.payment.contract}</code><br>
                2. Retry with X-Payment header
              </p>
            </div>
          \`;
          return;
        }

        const data = await res.json();

        resultSection.innerHTML = \`
          <div class="result-header">
            <div>
              \${data.bnsName ? \`<div class="bns-name">\${data.bnsName}</div>\` : ''}
              <div class="wallet-address">\${data.address}</div>
            </div>
          </div>
          <div class="stats-grid">
            <div class="stat">
              <div class="stat-value">\${data.summary.totalValueUsd}</div>
              <div class="stat-label">Total Value</div>
            </div>
            <div class="stat">
              <div class="stat-value">\${data.summary.stxBalance}</div>
              <div class="stat-label">STX Balance</div>
            </div>
            <div class="stat">
              <div class="stat-value">\${data.summary.tokenCount}</div>
              <div class="stat-label">Tokens</div>
            </div>
          </div>
          \${data.summary.topHoldings?.length ? \`
            <div style="margin-top: 1rem;">
              <h4 style="font-size: 0.9rem; margin-bottom: 0.75rem;">Top Holdings</h4>
              \${data.summary.topHoldings.map(h => \`
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border);">
                  <span>\${h.symbol}</span>
                  <span style="color: var(--text-muted);">\${h.value} \${h.change24h ? \`<span style="color: \${h.change24h.startsWith('+') ? 'var(--green)' : 'var(--red)'}">\${h.change24h}</span>\` : ''}</span>
                </div>
              \`).join('')}
            </div>
          \` : ''}
        \`;
      } catch (err) {
        resultSection.innerHTML = '<div class="loading" style="color: var(--red);">Error: ' + err.message + '</div>';
      }
    }

    // Allow enter key
    document.getElementById('address-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') analyzeWallet();
    });
  </script>
</body>
</html>`;
}

// Payment config - sBTC only
const PAYMENT_ADDRESS = 'SPKH9AWG0ENZ87J1X0PBD4HETP22G8W22AFNVF8K'
const PRICING = {
  fullReport: 2500, // 2500 sats (~$2.50) for full wallet intelligence report
  quickSummary: 500, // 500 sats (~$0.50) for quick summary
};

// Legacy CONTRACT constant for compatibility with existing code
const CONTRACT = {
  address: PAYMENT_ADDRESS,
  name: 'sbtc-payment',
  price: PRICING.fullReport,
  quickPrice: PRICING.quickSummary,
  priceSbtc: PRICING.fullReport,
  quickPriceSbtc: PRICING.quickSummary,
  recipient: PAYMENT_ADDRESS,
};

// sBTC contract
const SBTC_CONTRACT = {
  address: 'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9',
  name: 'token-sbtc',
};

type PaymentTokenType = 'STX' | 'sBTC';

function getPaymentTokenType(c: any): PaymentTokenType {
  const queryToken = c.req.query('tokenType');
  const headerToken = c.req.header('X-PAYMENT-TOKEN-TYPE');
  const tokenStr = (headerToken || queryToken || 'STX').toUpperCase();
  return tokenStr === 'SBTC' ? 'sBTC' : 'STX';
}

const HIRO_API = 'https://api.hiro.so';
const TENERO_API = 'https://api.tenero.io';

// Known DeFi protocol contracts
const DEFI_PROTOCOLS: Record<string, { name: string; type: 'dex' | 'lending' | 'staking' | 'vault' }> = {
  'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.alex-vault': { name: 'ALEX', type: 'vault' },
  'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.alex-reserve-pool': { name: 'ALEX', type: 'staking' },
  'SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.alex-launchpad': { name: 'ALEX', type: 'staking' },
  'SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.velar-v2-swap': { name: 'Velar', type: 'dex' },
  'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-swap-v2-1': { name: 'Arkadiko', type: 'dex' },
  'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-vaults-v1-1': { name: 'Arkadiko', type: 'vault' },
  'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-stake-pool-v2-1': { name: 'Arkadiko', type: 'staking' },
  'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.stacking-dao-core-v1': { name: 'StackingDAO', type: 'staking' },
  'SM3KNVZS30WM7F89SXKVVFY4SN9RMPZZ9FX929N0V.sbtc-deposit': { name: 'sBTC', type: 'vault' },
  'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.Wrapped-Bitcoin': { name: 'xBTC', type: 'vault' },
};

// Meme/high-risk tokens
const HIGH_RISK_TOKENS = ['WELSH', 'LEO', 'PEPE', 'NOT', 'DROID', 'ODIN', 'ROO', 'GIGA', 'MOON'];

// Blue chip tokens
const BLUE_CHIP_TOKENS = ['STX', 'sBTC', 'xBTC', 'USDA', 'sUSDT', 'ALEX', 'VELAR'];

// Types
interface TokenHolding {
  symbol: string;
  name: string;
  contract: string;
  balance: string;
  balanceFormatted: number;
  valueUsd: number;
  priceUsd: number;
  change24h: number | null;
  category: 'blue-chip' | 'defi' | 'meme' | 'other';
}

interface NFTHolding {
  collection: string;
  collectionName: string;
  tokenId: number;
  count: number;
}

interface DeFiPosition {
  protocol: string;
  type: 'dex' | 'lending' | 'staking' | 'vault';
  interactions: number;
  lastInteraction: string | null;
}

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
    riskScore: number; // 0-100
    riskLevel: 'low' | 'medium' | 'high';
    activityLevel: 'inactive' | 'low' | 'moderate' | 'high' | 'whale';
    portfolioHealth: 'poor' | 'fair' | 'good' | 'excellent';
  };
  allocation: {
    stx: number;
    blueChip: number;
    defi: number;
    meme: number;
    other: number;
  };
  tokens: TokenHolding[];
  nfts: NFTHolding[];
  defi: DeFiPosition[];
  recentActivity: {
    txCount30d: number;
    lastActive: string | null;
    topInteractions: string[];
  };
  insights: Array<{
    type: 'info' | 'warning' | 'opportunity' | 'risk';
    title: string;
    description: string;
    action?: string;
  }>;
}

// Cache for prices (5 min TTL)
let priceCache: { stx: number; timestamp: number } | null = null;
const PRICE_CACHE_TTL = 5 * 60 * 1000;

// Payment required response - sBTC only
function paymentRequired(c: any, resource: string, _price: number, sbtcPrice?: number) {
  const nonce = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  return c.json({
    error: 'Payment Required',
    code: 'PAYMENT_REQUIRED',
    resource,
    nonce,
    expiresAt,
    network: 'mainnet',
    maxAmountRequired: (sbtcPrice || PRICING.fullReport).toString(),
    payTo: PAYMENT_ADDRESS,
    tokenType: 'sBTC',
    tokenContract: SBTC_CONTRACT,
    instructions: [
      '1. Sign an sBTC transfer transaction',
      '2. Include the signed transaction hex in X-Payment header',
      '3. Transaction will be broadcast and verified',
    ],
  }, 402);
}

// Verify sBTC payment
async function verifyPayment(txid: string): Promise<{ valid: boolean; error?: string; caller?: string }> {
  try {
    const normalizedTxid = txid.startsWith('0x') ? txid : `0x${txid}`;
    const response = await fetch(`${HIRO_API}/extended/v1/tx/${normalizedTxid}`);
    if (!response.ok) return { valid: false, error: 'Transaction not found' };

    const tx = await response.json() as any;
    if (tx.tx_status !== 'success') return { valid: false, error: `Transaction status: ${tx.tx_status}` };

    // Accept sBTC transfers
    if (tx.tx_type === 'contract_call') {
      if (!tx.contract_call?.contract_id?.includes('sbtc')) {
        return { valid: false, error: 'Not an sBTC transfer' };
      }
    }

    return { valid: true, caller: tx.sender_address };
  } catch (error) {
    return { valid: false, error: `Verification failed: ${error}` };
  }
}

// Fetch real-time STX price from multiple sources
async function fetchStxPrice(): Promise<number> {
  // Check cache
  if (priceCache && Date.now() - priceCache.timestamp < PRICE_CACHE_TTL) {
    return priceCache.stx;
  }

  try {
    // Try CoinGecko first
    const cgRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=blockstack&vs_currencies=usd');
    if (cgRes.ok) {
      const data = await cgRes.json() as any;
      if (data?.blockstack?.usd) {
        priceCache = { stx: data.blockstack.usd, timestamp: Date.now() };
        return data.blockstack.usd;
      }
    }
  } catch {}

  try {
    // Fallback to Tenero
    const teneroRes = await fetch(`${TENERO_API}/v1/stacks/tokens/SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.wstx`);
    if (teneroRes.ok) {
      const data = await teneroRes.json() as any;
      if (data?.data?.price_usd) {
        const price = parseFloat(data.data.price_usd);
        priceCache = { stx: price, timestamp: Date.now() };
        return price;
      }
    }
  } catch {}

  // Last resort fallback
  return priceCache?.stx || 0.85;
}

// Fetch BNS name for address
async function fetchBnsName(address: string): Promise<string | null> {
  try {
    const res = await fetch(`${HIRO_API}/v1/addresses/stacks/${address}`);
    if (!res.ok) return null;
    const data = await res.json() as any;
    if (data.names && data.names.length > 0) {
      return data.names[0];
    }
    return null;
  } catch {
    return null;
  }
}

// Fetch STX balance
async function fetchStxBalance(address: string): Promise<number> {
  try {
    const res = await fetch(`${HIRO_API}/extended/v1/address/${address}/stx`);
    if (!res.ok) return 0;
    const data = await res.json() as any;
    return parseInt(data.balance || '0') / 1_000_000;
  } catch {
    return 0;
  }
}

// Categorize token
function categorizeToken(symbol: string, contract: string): 'blue-chip' | 'defi' | 'meme' | 'other' {
  const upperSymbol = symbol.toUpperCase();
  if (BLUE_CHIP_TOKENS.includes(upperSymbol)) return 'blue-chip';
  if (HIGH_RISK_TOKENS.includes(upperSymbol)) return 'meme';
  if (contract.includes('alex') || contract.includes('velar') || contract.includes('arkadiko')) return 'defi';
  return 'other';
}

// Fetch token holdings from Tenero
async function fetchTokenHoldings(address: string): Promise<TokenHolding[]> {
  try {
    const res = await fetch(`${TENERO_API}/v1/stacks/wallets/${address}/holdings`);
    if (!res.ok) return [];
    const data = await res.json() as any;

    return (data.data?.rows || []).map((t: any) => {
      const symbol = t.token?.symbol || 'UNKNOWN';
      const contract = t.token_address || '';
      return {
        symbol,
        name: t.token?.name || 'Unknown Token',
        contract,
        balance: t.balance,
        balanceFormatted: parseFloat(t.balance_formatted || '0'),
        valueUsd: parseFloat(t.value_usd || '0'),
        priceUsd: parseFloat(t.token?.price_usd || '0'),
        change24h: t.token?.change_24h ? parseFloat(t.token.change_24h) : null,
        category: categorizeToken(symbol, contract),
      };
    });
  } catch {
    return [];
  }
}

// Fetch NFT holdings with collection grouping
async function fetchNFTHoldings(address: string): Promise<NFTHolding[]> {
  try {
    const res = await fetch(`${HIRO_API}/extended/v1/tokens/nft/holdings?principal=${address}&limit=100`);
    if (!res.ok) return [];
    const data = await res.json() as any;

    // Group by collection
    const collections: Record<string, { name: string; count: number; tokenIds: number[] }> = {};

    for (const nft of data.results || []) {
      const collectionId = nft.asset_identifier?.split('::')[0] || 'Unknown';
      const collectionName = collectionId.split('.').pop() || 'Unknown';
      const tokenId = parseInt(nft.value?.repr?.replace('u', '') || '0');

      if (!collections[collectionId]) {
        collections[collectionId] = { name: collectionName, count: 0, tokenIds: [] };
      }
      collections[collectionId].count++;
      collections[collectionId].tokenIds.push(tokenId);
    }

    return Object.entries(collections).map(([collection, data]) => ({
      collection,
      collectionName: data.name,
      tokenId: data.tokenIds[0],
      count: data.count,
    }));
  } catch {
    return [];
  }
}

// Detect DeFi positions from transaction history
async function detectDeFiPositions(address: string): Promise<{ positions: DeFiPosition[]; topInteractions: string[]; txCount30d: number; lastActive: string | null }> {
  try {
    const res = await fetch(`${HIRO_API}/extended/v1/address/${address}/transactions?limit=100`);
    if (!res.ok) return { positions: [], topInteractions: [], txCount30d: 0, lastActive: null };

    const data = await res.json() as any;
    const txs = data.results || [];

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentTxs = txs.filter((tx: any) => new Date(tx.burn_block_time_iso).getTime() > thirtyDaysAgo);

    // Track DeFi interactions
    const defiInteractions: Record<string, { protocol: string; type: 'dex' | 'lending' | 'staking' | 'vault'; count: number; lastTx: string }> = {};
    const allInteractions: Record<string, number> = {};

    for (const tx of txs) {
      if (tx.tx_type === 'contract_call' && tx.contract_call?.contract_id) {
        const contract = tx.contract_call.contract_id;
        allInteractions[contract] = (allInteractions[contract] || 0) + 1;

        // Check if it's a known DeFi protocol
        for (const [defiContract, info] of Object.entries(DEFI_PROTOCOLS)) {
          if (contract.includes(defiContract.split('.')[0])) {
            const key = info.name;
            if (!defiInteractions[key]) {
              defiInteractions[key] = {
                protocol: info.name,
                type: info.type,
                count: 0,
                lastTx: tx.burn_block_time_iso
              };
            }
            defiInteractions[key].count++;
            break;
          }
        }
      }
    }

    const positions = Object.values(defiInteractions).map(d => ({
      protocol: d.protocol,
      type: d.type,
      interactions: d.count,
      lastInteraction: d.lastTx,
    }));

    const topInteractions = Object.entries(allInteractions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([contract]) => contract);

    return {
      positions,
      topInteractions,
      txCount30d: recentTxs.length,
      lastActive: txs[0]?.burn_block_time_iso || null,
    };
  } catch {
    return { positions: [], topInteractions: [], txCount30d: 0, lastActive: null };
  }
}

// Calculate risk score (0-100)
function calculateRiskScore(tokens: TokenHolding[], allocation: WalletReport['allocation']): { score: number; level: 'low' | 'medium' | 'high' } {
  let score = 0;

  // Meme token exposure (0-40 points)
  score += Math.min(allocation.meme * 80, 40);

  // Concentration risk (0-30 points)
  if (tokens.length > 0) {
    const maxPct = Math.max(...tokens.map(t => t.valueUsd)) / tokens.reduce((s, t) => s + t.valueUsd, 0.01);
    score += maxPct * 30;
  }

  // Low diversification (0-20 points)
  if (tokens.length <= 2) score += 20;
  else if (tokens.length <= 5) score += 10;

  // Volatility (high 24h changes)
  const avgChange = tokens.reduce((s, t) => s + Math.abs(t.change24h || 0), 0) / (tokens.length || 1);
  if (avgChange > 20) score += 10;

  score = Math.min(Math.round(score), 100);

  let level: 'low' | 'medium' | 'high' = 'low';
  if (score >= 60) level = 'high';
  else if (score >= 30) level = 'medium';

  return { score, level };
}

// Calculate portfolio health
function calculatePortfolioHealth(allocation: WalletReport['allocation'], tokens: TokenHolding[]): 'poor' | 'fair' | 'good' | 'excellent' {
  const diversified = tokens.length >= 5;
  const lowMeme = allocation.meme < 0.2;
  const hasBlueChip = allocation.blueChip > 0.3;
  const hasStx = allocation.stx > 0.1;

  const score = (diversified ? 1 : 0) + (lowMeme ? 1 : 0) + (hasBlueChip ? 1 : 0) + (hasStx ? 1 : 0);

  if (score >= 4) return 'excellent';
  if (score >= 3) return 'good';
  if (score >= 2) return 'fair';
  return 'poor';
}

// Calculate activity level
function calculateActivityLevel(txCount30d: number, totalValue: number): 'inactive' | 'low' | 'moderate' | 'high' | 'whale' {
  if (totalValue > 100000) return 'whale';
  if (txCount30d === 0) return 'inactive';
  if (txCount30d < 5) return 'low';
  if (txCount30d < 20) return 'moderate';
  return 'high';
}

// Generate actionable insights
function generateInsights(report: WalletReport): WalletReport['insights'] {
  const insights: WalletReport['insights'] = [];

  // Portfolio value
  if (report.summary.totalValueUsd > 50000) {
    insights.push({
      type: 'info',
      title: 'Large Portfolio',
      description: `Portfolio value of $${report.summary.totalValueUsd.toLocaleString()} puts you in the top tier of Stacks holders.`,
    });
  }

  // Risk warnings
  if (report.summary.riskLevel === 'high') {
    insights.push({
      type: 'risk',
      title: 'High Risk Profile',
      description: `${Math.round(report.allocation.meme * 100)}% of your portfolio is in high-volatility tokens.`,
      action: 'Consider rebalancing into stable assets like STX, sBTC, or USDA.',
    });
  }

  // Concentration risk
  if (report.tokens.length > 0) {
    const topToken = report.tokens.reduce((max, t) => t.valueUsd > max.valueUsd ? t : max);
    const topPct = topToken.valueUsd / report.summary.totalValueUsd;
    if (topPct > 0.6) {
      insights.push({
        type: 'warning',
        title: 'Concentration Risk',
        description: `${Math.round(topPct * 100)}% of your portfolio is in ${topToken.symbol}.`,
        action: 'Diversification could reduce volatility.',
      });
    }
  }

  // Low STX holdings
  if (report.allocation.stx < 0.1 && report.summary.totalValueUsd > 100) {
    insights.push({
      type: 'warning',
      title: 'Low STX Balance',
      description: 'STX is needed for transaction fees and stacking rewards.',
      action: 'Consider holding at least 10% in STX for gas and stacking.',
    });
  }

  // DeFi opportunities
  if (report.defi.length === 0 && report.summary.stxBalance > 100) {
    insights.push({
      type: 'opportunity',
      title: 'DeFi Opportunities',
      description: 'You have STX that could be earning yield.',
      action: 'Explore stacking via StackingDAO or liquidity provision on ALEX.',
    });
  }

  // Stacking opportunity
  if (report.summary.stxBalance > 500 && !report.defi.some(d => d.type === 'staking')) {
    insights.push({
      type: 'opportunity',
      title: 'Stacking Available',
      description: `Your ${report.summary.stxBalance.toFixed(0)} STX could earn ~8-10% APY through stacking.`,
      action: 'Stack directly or use liquid stacking protocols like StackingDAO.',
    });
  }

  // sBTC opportunity
  if (report.allocation.blueChip > 0.5 && !report.tokens.some(t => t.symbol === 'sBTC')) {
    insights.push({
      type: 'opportunity',
      title: 'sBTC Consideration',
      description: 'sBTC offers Bitcoin exposure with DeFi utility on Stacks.',
      action: 'Consider allocating some portfolio to sBTC for yield opportunities.',
    });
  }

  // Inactive wallet
  if (report.summary.activityLevel === 'inactive') {
    insights.push({
      type: 'info',
      title: 'Dormant Wallet',
      description: 'No transactions in the last 30 days.',
      action: 'Your assets may be missing yield opportunities.',
    });
  }

  // NFT holder
  if (report.summary.nftCount > 10) {
    insights.push({
      type: 'info',
      title: 'NFT Collector',
      description: `Holding ${report.summary.nftCount} NFTs across ${report.nfts.length} collections.`,
    });
  }

  return insights;
}

// Root - API info / Frontend
app.get('/', (c) => {
  const accept = c.req.header('Accept') || '';
  if (accept.includes('text/html')) {
    return c.html(getFrontendHtml());
  }
  return c.json({
    name: 'Wallet Intelligence API',
    description: 'Deep analysis of any Stacks wallet - holdings, DeFi positions, risk score, actionable insights',
    version: '2.0.0',
    contract: `${CONTRACT.address}.${CONTRACT.name}`,
    endpoints: {
      paid: [
        { path: '/analyze/:address', method: 'GET', price: `${CONTRACT.price} microSTX`, description: 'Full wallet intelligence report' },
        { path: '/quick/:address', method: 'GET', price: `${CONTRACT.quickPrice} microSTX`, description: 'Quick portfolio summary' },
      ],
      free: [
        { path: '/', method: 'GET', description: 'API info' },
        { path: '/health', method: 'GET', description: 'Health check' },
      ],
    },
    features: [
      'Real-time token valuations with live STX price',
      'BNS name resolution',
      'DeFi position detection (ALEX, Velar, Arkadiko, StackingDAO)',
      'NFT inventory grouped by collection',
      'Portfolio allocation breakdown',
      'Risk score (0-100) with level assessment',
      'Actionable insights and opportunities',
    ],
    data_sources: ['Hiro API', 'Tenero API', 'CoinGecko', 'On-chain analysis'],
  });
});

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// x402 Discovery endpoint
app.get('/.well-known/x402', (c) => {
  return c.json({
    x402Version: 1,
    name: 'Wallet Intelligence',
    description: 'Deep analysis of any Stacks wallet - holdings, DeFi positions, risk score, actionable insights',
    accepts: [
      {
        scheme: 'exact',
        network: 'stacks',
        maxAmountRequired: String(PRICING.quickSummary),
        resource: '/quick/:address',
        description: 'Quick wallet summary with total value, STX balance, and top holdings',
        mimeType: 'application/json',
        payTo: PAYMENT_ADDRESS,
        maxTimeoutSeconds: 300,
        asset: 'sBTC',
        outputSchema: {
          input: {
            type: 'object',
            properties: {
              address: { type: 'string', description: 'Stacks wallet address (SP... or SM...)' }
            },
            required: ['address']
          },
          output: {
            type: 'object',
            properties: {
              address: { type: 'string' },
              bnsName: { type: 'string', nullable: true },
              timestamp: { type: 'string' },
              summary: {
                type: 'object',
                properties: {
                  totalValueUsd: { type: 'string' },
                  stxBalance: { type: 'string' },
                  stxPrice: { type: 'string' },
                  tokenCount: { type: 'number' },
                  topHoldings: { type: 'array' }
                }
              }
            }
          }
        }
      },
      {
        scheme: 'exact',
        network: 'stacks',
        maxAmountRequired: String(PRICING.fullReport),
        resource: '/analyze/:address',
        description: 'Full wallet intelligence report with risk score, DeFi positions, NFTs, and insights',
        mimeType: 'application/json',
        payTo: PAYMENT_ADDRESS,
        maxTimeoutSeconds: 300,
        asset: 'sBTC',
        outputSchema: {
          input: {
            type: 'object',
            properties: {
              address: { type: 'string', description: 'Stacks wallet address (SP... or SM...)' }
            },
            required: ['address']
          },
          output: {
            type: 'object',
            properties: {
              address: { type: 'string' },
              bnsName: { type: 'string', nullable: true },
              timestamp: { type: 'string' },
              summary: {
                type: 'object',
                properties: {
                  totalValueUsd: { type: 'number' },
                  stxBalance: { type: 'number' },
                  stxPrice: { type: 'number' },
                  tokenCount: { type: 'number' },
                  nftCount: { type: 'number' },
                  defiProtocols: { type: 'number' },
                  riskScore: { type: 'number', description: '0-100 risk score' },
                  riskLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
                  activityLevel: { type: 'string' },
                  portfolioHealth: { type: 'string' }
                }
              },
              allocation: { type: 'object' },
              tokens: { type: 'array' },
              nfts: { type: 'array' },
              defi: { type: 'array' },
              recentActivity: { type: 'object' },
              insights: { type: 'array' }
            }
          }
        }
      }
    ]
  });
});

// Full wallet analysis
app.get('/analyze/:address', async (c) => {
  const address = c.req.param('address');
  const paymentTxid = c.req.header('X-Payment');

  if (!paymentTxid) {
    return paymentRequired(c, `/analyze/${address}`, CONTRACT.price, CONTRACT.priceSbtc);
  }

  const verification = await verifyPayment(paymentTxid);
  if (!verification.valid) {
    return c.json({ error: 'Payment verification failed', details: verification.error }, 403);
  }

  if (!address.startsWith('SP') && !address.startsWith('SM')) {
    return c.json({ error: 'Invalid Stacks address' }, 400);
  }

  // Fetch all data in parallel
  const [stxPrice, bnsName, stxBalance, tokens, nfts, defiData] = await Promise.all([
    fetchStxPrice(),
    fetchBnsName(address),
    fetchStxBalance(address),
    fetchTokenHoldings(address),
    fetchNFTHoldings(address),
    detectDeFiPositions(address),
  ]);

  // Calculate totals
  const tokenValue = tokens.reduce((sum, t) => sum + t.valueUsd, 0);
  const stxValueUsd = stxBalance * stxPrice;
  const totalValueUsd = tokenValue + stxValueUsd;

  // Calculate allocation
  const blueChipValue = tokens.filter(t => t.category === 'blue-chip').reduce((s, t) => s + t.valueUsd, 0);
  const defiValue = tokens.filter(t => t.category === 'defi').reduce((s, t) => s + t.valueUsd, 0);
  const memeValue = tokens.filter(t => t.category === 'meme').reduce((s, t) => s + t.valueUsd, 0);
  const otherValue = tokens.filter(t => t.category === 'other').reduce((s, t) => s + t.valueUsd, 0);

  const allocation = {
    stx: totalValueUsd > 0 ? stxValueUsd / totalValueUsd : 0,
    blueChip: totalValueUsd > 0 ? blueChipValue / totalValueUsd : 0,
    defi: totalValueUsd > 0 ? defiValue / totalValueUsd : 0,
    meme: totalValueUsd > 0 ? memeValue / totalValueUsd : 0,
    other: totalValueUsd > 0 ? otherValue / totalValueUsd : 0,
  };

  const { score: riskScore, level: riskLevel } = calculateRiskScore(tokens, allocation);
  const activityLevel = calculateActivityLevel(defiData.txCount30d, totalValueUsd);
  const portfolioHealth = calculatePortfolioHealth(allocation, tokens);

  const report: WalletReport = {
    address,
    bnsName,
    timestamp: new Date().toISOString(),
    summary: {
      totalValueUsd,
      stxBalance,
      stxPrice,
      tokenCount: tokens.length,
      nftCount: nfts.reduce((s, n) => s + n.count, 0),
      defiProtocols: defiData.positions.length,
      riskScore,
      riskLevel,
      activityLevel,
      portfolioHealth,
    },
    allocation,
    tokens: tokens.sort((a, b) => b.valueUsd - a.valueUsd),
    nfts: nfts.sort((a, b) => b.count - a.count),
    defi: defiData.positions,
    recentActivity: {
      txCount30d: defiData.txCount30d,
      lastActive: defiData.lastActive,
      topInteractions: defiData.topInteractions,
    },
    insights: [],
  };

  report.insights = generateInsights(report);

  return c.json(report);
});

// Quick summary
app.get('/quick/:address', async (c) => {
  const address = c.req.param('address');
  const paymentTxid = c.req.header('X-Payment');

  if (!paymentTxid) {
    return paymentRequired(c, `/quick/${address}`, CONTRACT.quickPrice, CONTRACT.quickPriceSbtc);
  }

  const verification = await verifyPayment(paymentTxid);
  if (!verification.valid) {
    return c.json({ error: 'Payment verification failed', details: verification.error }, 403);
  }

  if (!address.startsWith('SP') && !address.startsWith('SM')) {
    return c.json({ error: 'Invalid Stacks address' }, 400);
  }

  // Quick fetch
  const [stxPrice, bnsName, stxBalance, tokens] = await Promise.all([
    fetchStxPrice(),
    fetchBnsName(address),
    fetchStxBalance(address),
    fetchTokenHoldings(address),
  ]);

  const tokenValue = tokens.reduce((sum, t) => sum + t.valueUsd, 0);
  const stxValueUsd = stxBalance * stxPrice;
  const totalValueUsd = tokenValue + stxValueUsd;

  return c.json({
    address,
    bnsName,
    timestamp: new Date().toISOString(),
    summary: {
      totalValueUsd: `$${totalValueUsd.toFixed(2)}`,
      stxBalance: `${stxBalance.toFixed(2)} STX`,
      stxPrice: `$${stxPrice.toFixed(4)}`,
      tokenCount: tokens.length,
      topHoldings: tokens.slice(0, 5).map(t => ({
        symbol: t.symbol,
        value: `$${t.valueUsd.toFixed(2)}`,
        change24h: t.change24h ? `${t.change24h > 0 ? '+' : ''}${t.change24h.toFixed(1)}%` : null,
      })),
    },
  });
});

export default app;
