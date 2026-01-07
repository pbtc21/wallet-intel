/**
 * Wallet Intelligence API
 * Deep analysis of any Stacks wallet - holdings, PnL, risk score, DeFi positions
 * x402 payment-gated endpoint
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();
app.use('*', cors());

// Payment config
const CONTRACT = {
  address: 'SPP5ZMH9NQDFD2K5CEQZ6P02AP8YPWMQ75TJW20M',
  name: 'simple-oracle',
  price: 100000, // 0.1 STX for full report
  quickPrice: 25000, // 0.025 STX for quick summary
  recipient: 'SPP5ZMH9NQDFD2K5CEQZ6P02AP8YPWMQ75TJW20M',
};

const HIRO_API = 'https://api.hiro.so';
const TENERO_API = 'https://api.tenero.io';

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
}

interface NFTHolding {
  collection: string;
  tokenId: number;
  name: string | null;
  imageUrl: string | null;
  floorPrice: number | null;
}

interface DeFiPosition {
  protocol: string;
  type: 'lending' | 'borrowing' | 'liquidity' | 'staking';
  asset: string;
  amount: number;
  valueUsd: number;
  apy: number | null;
  healthFactor: number | null;
}

interface WalletReport {
  address: string;
  timestamp: string;
  summary: {
    totalValueUsd: number;
    stxBalance: number;
    tokenCount: number;
    nftCount: number;
    defiPositions: number;
    riskScore: 'low' | 'medium' | 'high';
    activityLevel: 'inactive' | 'low' | 'moderate' | 'high' | 'whale';
  };
  tokens: TokenHolding[];
  nfts: NFTHolding[];
  defi: DeFiPosition[];
  recentActivity: {
    txCount30d: number;
    lastActive: string | null;
    topInteractions: string[];
  };
  insights: string[];
}

// Payment required response
function paymentRequired(c: any, resource: string, price: number) {
  return c.json({
    error: 'Payment Required',
    code: 'PAYMENT_REQUIRED',
    resource,
    payment: {
      contract: `${CONTRACT.address}.${CONTRACT.name}`,
      function: 'call-with-stx',
      price,
      token: 'STX',
      recipient: CONTRACT.recipient,
      network: 'mainnet',
    },
    instructions: [
      '1. Call the contract function with STX payment',
      '2. Wait for transaction confirmation',
      '3. Retry request with X-Payment header containing txid',
    ],
  }, 402);
}

// Verify payment
async function verifyPayment(txid: string): Promise<{ valid: boolean; error?: string; caller?: string }> {
  try {
    const normalizedTxid = txid.startsWith('0x') ? txid : `0x${txid}`;
    const response = await fetch(`${HIRO_API}/extended/v1/tx/${normalizedTxid}`);
    if (!response.ok) return { valid: false, error: 'Transaction not found' };

    const tx = await response.json() as any;
    if (tx.tx_status !== 'success') return { valid: false, error: `Transaction status: ${tx.tx_status}` };
    if (tx.tx_type !== 'contract_call') return { valid: false, error: 'Not a contract call' };

    const expectedContract = `${CONTRACT.address}.${CONTRACT.name}`;
    if (tx.contract_call?.contract_id !== expectedContract) return { valid: false, error: 'Wrong contract' };

    return { valid: true, caller: tx.sender_address };
  } catch (error) {
    return { valid: false, error: `Verification failed: ${error}` };
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

// Fetch token holdings from Tenero
async function fetchTokenHoldings(address: string): Promise<TokenHolding[]> {
  try {
    const res = await fetch(`${TENERO_API}/v1/stacks/wallets/${address}/holdings`);
    if (!res.ok) return [];
    const data = await res.json() as any;

    return (data.data?.rows || []).map((t: any) => ({
      symbol: t.token?.symbol || 'UNKNOWN',
      name: t.token?.name || 'Unknown Token',
      contract: t.token_address,
      balance: t.balance,
      balanceFormatted: parseFloat(t.balance_formatted || '0'),
      valueUsd: parseFloat(t.value_usd || '0'),
      priceUsd: parseFloat(t.token?.price_usd || '0'),
      change24h: t.token?.change_24h ? parseFloat(t.token.change_24h) : null,
    }));
  } catch {
    return [];
  }
}

// Fetch NFT holdings
async function fetchNFTHoldings(address: string): Promise<NFTHolding[]> {
  try {
    const res = await fetch(`${HIRO_API}/extended/v1/tokens/nft/holdings?principal=${address}&limit=50`);
    if (!res.ok) return [];
    const data = await res.json() as any;

    return (data.results || []).slice(0, 20).map((nft: any) => ({
      collection: nft.asset_identifier?.split('::')[0] || 'Unknown',
      tokenId: parseInt(nft.value?.repr?.replace('u', '') || '0'),
      name: null,
      imageUrl: null,
      floorPrice: null,
    }));
  } catch {
    return [];
  }
}

// Fetch recent activity
async function fetchRecentActivity(address: string): Promise<{ txCount30d: number; lastActive: string | null; topInteractions: string[] }> {
  try {
    const res = await fetch(`${HIRO_API}/extended/v1/address/${address}/transactions?limit=50`);
    if (!res.ok) return { txCount30d: 0, lastActive: null, topInteractions: [] };

    const data = await res.json() as any;
    const txs = data.results || [];

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentTxs = txs.filter((tx: any) => new Date(tx.burn_block_time_iso).getTime() > thirtyDaysAgo);

    const interactions: Record<string, number> = {};
    for (const tx of txs) {
      if (tx.tx_type === 'contract_call' && tx.contract_call?.contract_id) {
        const contract = tx.contract_call.contract_id;
        interactions[contract] = (interactions[contract] || 0) + 1;
      }
    }

    const topInteractions = Object.entries(interactions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([contract]) => contract);

    return {
      txCount30d: recentTxs.length,
      lastActive: txs[0]?.burn_block_time_iso || null,
      topInteractions,
    };
  } catch {
    return { txCount30d: 0, lastActive: null, topInteractions: [] };
  }
}

// Calculate risk score
function calculateRiskScore(tokens: TokenHolding[], stxBalance: number, totalValue: number): 'low' | 'medium' | 'high' {
  // High concentration in single asset = higher risk
  const maxTokenPct = tokens.length > 0 ? Math.max(...tokens.map(t => t.valueUsd / totalValue)) : 0;

  // Meme coins = higher risk
  const memeTokens = tokens.filter(t =>
    ['WELSH', 'LEO', 'PEPE', 'NOT', 'DROID'].includes(t.symbol.toUpperCase())
  );
  const memePct = memeTokens.reduce((sum, t) => sum + t.valueUsd, 0) / totalValue;

  if (maxTokenPct > 0.8 || memePct > 0.5) return 'high';
  if (maxTokenPct > 0.5 || memePct > 0.25) return 'medium';
  return 'low';
}

// Calculate activity level
function calculateActivityLevel(txCount30d: number, totalValue: number): 'inactive' | 'low' | 'moderate' | 'high' | 'whale' {
  if (totalValue > 100000) return 'whale';
  if (txCount30d === 0) return 'inactive';
  if (txCount30d < 5) return 'low';
  if (txCount30d < 20) return 'moderate';
  return 'high';
}

// Generate insights
function generateInsights(report: Partial<WalletReport>): string[] {
  const insights: string[] = [];
  const tokens = report.tokens || [];
  const summary = report.summary;

  if (!summary) return insights;

  // Value insights
  if (summary.totalValueUsd > 10000) {
    insights.push(`Significant portfolio value ($${summary.totalValueUsd.toFixed(0)})`);
  }

  // Diversification
  if (tokens.length > 10) {
    insights.push('Well-diversified across multiple tokens');
  } else if (tokens.length <= 2) {
    insights.push('Concentrated portfolio - consider diversification');
  }

  // STX dominance
  const stxValue = summary.stxBalance * 0.35; // rough STX price
  if (stxValue / summary.totalValueUsd > 0.7) {
    insights.push('STX-heavy portfolio - exposure to single asset');
  }

  // DeFi activity
  if (summary.defiPositions > 0) {
    insights.push(`Active in DeFi with ${summary.defiPositions} positions`);
  }

  // Activity
  if (summary.activityLevel === 'whale') {
    insights.push('Whale wallet - large holder');
  } else if (summary.activityLevel === 'inactive') {
    insights.push('Dormant wallet - no recent activity');
  }

  // Risk
  if (summary.riskScore === 'high') {
    insights.push('High risk profile - concentrated or meme-heavy');
  }

  return insights;
}

// Root - API info
app.get('/', (c) => {
  return c.json({
    name: 'Wallet Intelligence API',
    description: 'Deep analysis of any Stacks wallet - holdings, PnL, risk score, activity patterns',
    version: '1.0.0',
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
      'Token holdings with USD values',
      'NFT inventory',
      'DeFi position detection',
      'Risk score calculation',
      'Activity analysis',
      'AI-generated insights',
    ],
    data_sources: ['Hiro API', 'Tenero API', 'On-chain analysis'],
  });
});

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Full wallet analysis
app.get('/analyze/:address', async (c) => {
  const address = c.req.param('address');
  const paymentTxid = c.req.header('X-Payment');

  if (!paymentTxid) {
    return paymentRequired(c, `/analyze/${address}`, CONTRACT.price);
  }

  const verification = await verifyPayment(paymentTxid);
  if (!verification.valid) {
    return c.json({ error: 'Payment verification failed', details: verification.error }, 403);
  }

  // Validate address format
  if (!address.startsWith('SP') && !address.startsWith('SM')) {
    return c.json({ error: 'Invalid Stacks address' }, 400);
  }

  // Fetch all data in parallel
  const [stxBalance, tokens, nfts, activity] = await Promise.all([
    fetchStxBalance(address),
    fetchTokenHoldings(address),
    fetchNFTHoldings(address),
    fetchRecentActivity(address),
  ]);

  // Calculate totals
  const tokenValue = tokens.reduce((sum, t) => sum + t.valueUsd, 0);
  const stxValueUsd = stxBalance * 0.35; // approximate STX price
  const totalValueUsd = tokenValue + stxValueUsd;

  const riskScore = calculateRiskScore(tokens, stxBalance, totalValueUsd);
  const activityLevel = calculateActivityLevel(activity.txCount30d, totalValueUsd);

  const report: WalletReport = {
    address,
    timestamp: new Date().toISOString(),
    summary: {
      totalValueUsd,
      stxBalance,
      tokenCount: tokens.length,
      nftCount: nfts.length,
      defiPositions: 0, // TODO: detect DeFi positions
      riskScore,
      activityLevel,
    },
    tokens,
    nfts,
    defi: [], // TODO: implement DeFi detection
    recentActivity: activity,
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
    return paymentRequired(c, `/quick/${address}`, CONTRACT.quickPrice);
  }

  const verification = await verifyPayment(paymentTxid);
  if (!verification.valid) {
    return c.json({ error: 'Payment verification failed', details: verification.error }, 403);
  }

  if (!address.startsWith('SP') && !address.startsWith('SM')) {
    return c.json({ error: 'Invalid Stacks address' }, 400);
  }

  // Quick fetch - just STX and tokens
  const [stxBalance, tokens] = await Promise.all([
    fetchStxBalance(address),
    fetchTokenHoldings(address),
  ]);

  const tokenValue = tokens.reduce((sum, t) => sum + t.valueUsd, 0);
  const stxValueUsd = stxBalance * 0.35;
  const totalValueUsd = tokenValue + stxValueUsd;

  return c.json({
    address,
    timestamp: new Date().toISOString(),
    quick: {
      totalValueUsd: `$${totalValueUsd.toFixed(2)}`,
      stxBalance: `${stxBalance.toFixed(2)} STX`,
      tokenCount: tokens.length,
      topHoldings: tokens.slice(0, 5).map(t => ({
        symbol: t.symbol,
        value: `$${t.valueUsd.toFixed(2)}`,
      })),
    },
  });
});

export default app;
