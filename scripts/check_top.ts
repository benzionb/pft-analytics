import { Client } from 'xrpl';

const RPC_WS_URL = 'wss://rpc.testnet.postfiat.org:6007';
const TOP_WALLET = 'rDqf4nowC2PAZgn1UGHDn46mcUMREYJrsr';

// Primary + relay reward addresses
const REWARD_ADDRESSES = [
  'rGBKxoTcavpfEso7ASRELZAMcCMqKa8oFk',
  'rKt4peDozpRW9zdYGiTZC54DSNU3Af6pQE',
  'rJNwqDPKSkbqDPNoNxbW6C3KCS84ZaQc96',
];

async function main() {
  const client = new Client(RPC_WS_URL);
  await client.connect();
  
  // Get balance
  const accountInfo = await client.request({
    command: 'account_info',
    account: TOP_WALLET,
    ledger_index: 'validated',
  });
  const balance = parseInt(accountInfo.result.account_data.Balance, 10) / 1_000_000;
  console.log(`Balance: ${balance.toLocaleString()} PFT\n`);
  
  // Get all transactions
  let allTxs: any[] = [];
  let marker: any = undefined;
  while (true) {
    const request: any = { command: 'account_tx', account: TOP_WALLET, limit: 400, forward: false };
    if (marker) request.marker = marker;
    const response = await client.request(request);
    const txs = response.result.transactions || [];
    if (txs.length === 0) break;
    allTxs.push(...txs);
    marker = response.result.marker;
    if (!marker) break;
  }
  
  // Analyze incoming
  let fromRewards = 0;
  let fromOther = 0;
  const otherSenders = new Map<string, number>();
  
  for (const txWrapper of allTxs) {
    const tx = txWrapper.tx_json || txWrapper.tx;
    if (!tx || tx.TransactionType !== 'Payment') continue;
    if (tx.Destination !== TOP_WALLET) continue;
    
    const amount = tx.DeliverMax || tx.Amount;
    let pft = 0;
    if (typeof amount === 'string') pft = parseInt(amount, 10) / 1_000_000;
    if (pft <= 0) continue;
    
    const sender = tx.Account || '';
    if (REWARD_ADDRESSES.includes(sender)) {
      fromRewards += pft;
    } else {
      fromOther += pft;
      otherSenders.set(sender, (otherSenders.get(sender) || 0) + pft);
    }
  }
  
  console.log('=== INCOMING BREAKDOWN ===');
  console.log(`From reward wallets: ${fromRewards.toLocaleString()} PFT`);
  console.log(`From other sources: ${fromOther.toLocaleString()} PFT`);
  console.log(`Total incoming: ${(fromRewards + fromOther).toLocaleString()} PFT`);
  
  if (otherSenders.size > 0) {
    console.log('\nTop non-reward senders:');
    const sorted = Array.from(otherSenders.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    for (const [sender, amount] of sorted) {
      console.log(`  ${sender}: ${amount.toLocaleString()} PFT`);
    }
  }
  
  await client.disconnect();
}

main().catch(console.error);
