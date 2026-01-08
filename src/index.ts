/**
 * Wallet Intelligence API
 * Deep analysis of any Stacks wallet - holdings, DeFi positions, risk score, insights
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

// Root - API info
app.get('/', (c) => {
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
    return paymentRequired(c, `/quick/${address}`, CONTRACT.quickPrice);
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
