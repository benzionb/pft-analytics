import './style.css';
import { fetchNetworkData, formatPFT, formatAddress } from './api';
import type { NetworkData } from './api';

// Polling interval in milliseconds (60 seconds)
const REFRESH_INTERVAL_MS = 60000;

// Store the interval ID so we can clear it if needed
let refreshIntervalId: number | null = null;

// Render all dashboard data to the DOM
function renderDashboard(data: NetworkData) {
  const totals = data.network_totals;

  // Network totals
  document.getElementById('network-totals')!.innerHTML = `
    <h2>Network Overview</h2>
    <div class="totals-grid">
      <div class="total-card highlight">
        <div class="value">${formatPFT(totals.total_pft_distributed)}</div>
        <div class="label">Total PFT Distributed</div>
      </div>
      <div class="total-card">
        <div class="value">${totals.unique_earners}</div>
        <div class="label">Unique Earners</div>
      </div>
      <div class="total-card">
        <div class="value">${totals.total_rewards_paid}</div>
        <div class="label">Rewards Paid</div>
      </div>
      <div class="total-card">
        <div class="value">${totals.total_submissions}</div>
        <div class="label">Task Submissions</div>
      </div>
      <div class="total-card">
        <div class="value">${totals.unique_submitters}</div>
        <div class="label">Active Submitters</div>
      </div>
    </div>
  `;

  // Derived metrics
  const avgPftPerReward = totals.total_rewards_paid > 0
    ? totals.total_pft_distributed / totals.total_rewards_paid
    : 0;
  const successRate = totals.total_submissions > 0
    ? (totals.total_rewards_paid / totals.total_submissions) * 100
    : 0;
  const avgPftPerEarner = totals.unique_earners > 0
    ? totals.total_pft_distributed / totals.unique_earners
    : 0;

  document.getElementById('derived-metrics')!.innerHTML = `
    <h2>Derived Metrics</h2>
    <div class="derived-metrics">
      <div class="derived-card">
        <div class="value">${formatPFT(avgPftPerReward)}</div>
        <div class="label">Avg Reward Size</div>
      </div>
      <div class="derived-card">
        <div class="value">${successRate.toFixed(1)}%</div>
        <div class="label">Submissions Rewarded</div>
      </div>
      <div class="derived-card">
        <div class="value">${formatPFT(avgPftPerEarner)}</div>
        <div class="label">Avg Earnings</div>
      </div>
    </div>
  `;

  // Leaderboard
  const leaderboardHtml = data.rewards.leaderboard.slice(0, 10).map((entry, i) => `
    <div class="leaderboard-row ${i < 3 ? 'top-' + (i + 1) : ''}">
      <div class="rank">#${i + 1}</div>
      <div class="address-cell">
        <span class="address" data-full-address="${entry.address}">
          ${formatAddress(entry.address)}
          <span class="address-tooltip">${entry.address}</span>
        </span>
        <a href="https://testnet.xrpl.org/accounts/${entry.address}" target="_blank" rel="noopener noreferrer" class="explorer-link" title="View on XRPL Explorer">↗</a>
      </div>
      <div class="pft">${formatPFT(entry.total_pft)}</div>
    </div>
  `).join('');

  document.getElementById('leaderboard')!.innerHTML = `
    <h2>Top Earners</h2>
    <div class="leaderboard">
      ${leaderboardHtml}
    </div>
  `;

  // Daily activity chart with continuous timeline
  const rawDailyData = data.rewards.daily_activity;

  // Build a continuous 14-day timeline ending today
  const today = new Date();
  const dateMap = new Map(rawDailyData.map(d => [d.date, d.pft]));
  const continuousData: Array<{ date: string; pft: number }> = [];

  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    continuousData.push({
      date: dateStr,
      pft: dateMap.get(dateStr) || 0
    });
  }

  const maxPft = Math.max(...continuousData.map(d => d.pft), 1);

  const dailyHtml = continuousData.map(d => {
    const height = d.pft > 0 ? Math.max((d.pft / maxPft) * 100, 2) : 0;
    const dateLabel = d.date.slice(5); // MM-DD
    const isEmpty = d.pft === 0;
    return `
      <div class="bar-column${isEmpty ? ' empty' : ''}">
        <div class="bar" style="height: ${isEmpty ? 2 : height}%">
          <span class="bar-value">${formatPFT(d.pft)}</span>
        </div>
        <div class="bar-label">${dateLabel}</div>
      </div>
    `;
  }).join('');

  document.getElementById('daily-activity')!.innerHTML = `
    <h2>Daily PFT Distribution (Last 14 Days)</h2>
    <div class="daily-chart">
      ${dailyHtml}
    </div>
  `;

  // Top submitters
  const submittersHtml = data.submissions.top_submitters.slice(0, 10).map((entry, i) => `
    <div class="submitter-row">
      <div class="rank">#${i + 1}</div>
      <div class="address-cell">
        <span class="address" data-full-address="${entry.address}">
          ${formatAddress(entry.address)}
          <span class="address-tooltip">${entry.address}</span>
        </span>
        <a href="https://testnet.xrpl.org/accounts/${entry.address}" target="_blank" rel="noopener noreferrer" class="explorer-link" title="View on XRPL Explorer">↗</a>
      </div>
      <div class="count">${entry.submissions}</div>
    </div>
  `).join('');

  document.getElementById('submitters')!.innerHTML = `
    <h2>Most Active Submitters</h2>
    <div class="submitters-list">
      ${submittersHtml}
    </div>
  `;

  // Update timestamps
  updateTimestamps(data);

  // Re-setup interactive handlers after DOM update
  setupAddressCopyHandlers();
  setupAddressSearch();
}

// Update footer and header timestamps
function updateTimestamps(data: NetworkData) {
  const genTime = new Date(data.metadata.generated_at);
  document.getElementById('last-updated')!.textContent = genTime.toLocaleString();

  // Format prominent header timestamp like "Jan 31, 2026 at 6:34 PM"
  const formattedDate = genTime.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const formattedTime = genTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  document.getElementById('data-timestamp')!.textContent = `Data generated ${formattedDate} at ${formattedTime} from XRPL chain`;
}

// Show refresh indicator
function showRefreshIndicator() {
  const indicator = document.getElementById('refresh-indicator');
  if (indicator) {
    indicator.classList.add('refreshing');
  }
}

// Hide refresh indicator
function hideRefreshIndicator() {
  const indicator = document.getElementById('refresh-indicator');
  if (indicator) {
    indicator.classList.remove('refreshing');
  }
}

// Start auto-refresh polling
function startPolling() {
  // Clear any existing interval
  if (refreshIntervalId !== null) {
    clearInterval(refreshIntervalId);
  }

  refreshIntervalId = window.setInterval(async () => {
    try {
      showRefreshIndicator();
      const freshData = await fetchNetworkData();
      renderDashboard(freshData);
      console.log('Dashboard refreshed at', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Auto-refresh failed:', error);
      // Don't break the UI - just log the error and wait for next interval
    } finally {
      hideRefreshIndicator();
    }
  }, REFRESH_INTERVAL_MS);
}

async function init() {
  const app = document.querySelector<HTMLDivElement>('#app')!;

  app.innerHTML = `
    <header class="header">
      <h1>PFT Analytics</h1>
      <p class="subtitle">Post Fiat Network Metrics — On-Chain Data</p>
      <p class="data-timestamp" id="data-timestamp"></p>
      <div id="refresh-indicator" class="refresh-indicator">
        <span class="refresh-dot"></span>
        <span class="refresh-text">Refreshing...</span>
      </div>
    </header>
    <div class="search-container">
      <div class="search-input-wrapper">
        <input type="text" id="address-search" class="address-search" placeholder="Search by address..." />
        <button type="button" id="search-clear" class="search-clear" aria-label="Clear search">&times;</button>
      </div>
      <div id="search-results-info" class="search-results-info" style="display: none;"></div>
      <div id="search-no-results" class="search-no-results" style="display: none;">No matching addresses</div>
    </div>
    <main class="dashboard">
      <section id="network-totals" class="section full-width">
        <h2>Network Overview</h2>
        <div class="loading">Loading on-chain data...</div>
      </section>
      <section id="derived-metrics" class="section full-width">
        <h2>Derived Metrics</h2>
        <div class="loading">Calculating...</div>
      </section>
      <section id="leaderboard" class="section">
        <h2>Top Earners</h2>
        <div class="loading">Loading...</div>
      </section>
      <section id="daily-activity" class="section">
        <h2>Daily Activity</h2>
        <div class="loading">Loading...</div>
      </section>
      <section id="submitters" class="section">
        <h2>Most Active Submitters</h2>
        <div class="loading">Loading...</div>
      </section>
    </main>
    <footer class="footer">
      <p>Data sourced from XRPL chain • Last updated: <span id="last-updated">--</span> • Auto-refreshes every 60s</p>
    </footer>
  `;

  try {
    const data = await fetchNetworkData();

    // Initial render
    renderDashboard(data);

    // Start auto-refresh polling
    startPolling();

  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    document.getElementById('network-totals')!.innerHTML = `
      <h2>Network Overview</h2>
      <div class="error">Failed to load network data. Run: python3 scripts/scan_network.py --output public/data/network.json</div>
    `;
  }
}

// Click-to-copy functionality for addresses
function setupAddressCopyHandlers() {
  const addresses = document.querySelectorAll('.address[data-full-address]');

  addresses.forEach(el => {
    el.addEventListener('click', async (e) => {
      e.stopPropagation();
      const fullAddress = el.getAttribute('data-full-address');
      if (!fullAddress) return;

      try {
        await navigator.clipboard.writeText(fullAddress);
        // Flash the address to confirm copy
        el.classList.add('copied');
        setTimeout(() => el.classList.remove('copied'), 200);
        showCopyFeedback();
      } catch (err) {
        console.error('Failed to copy address:', err);
        showCopyFeedback('Copy failed');
      }
    });
  });
}

// Show "Copied!" feedback toast
function showCopyFeedback(message: string = 'Copied!') {
  // Remove any existing feedback
  const existing = document.querySelector('.copy-feedback');
  if (existing) existing.remove();

  const feedback = document.createElement('div');
  feedback.className = 'copy-feedback';
  feedback.textContent = message;
  document.body.appendChild(feedback);

  // Remove after animation completes
  setTimeout(() => feedback.remove(), 1500);
}

// Address search/filter functionality
function setupAddressSearch() {
  const searchInput = document.getElementById('address-search') as HTMLInputElement;
  const clearBtn = document.getElementById('search-clear') as HTMLButtonElement;
  const noResultsEl = document.getElementById('search-no-results');
  const resultsInfoEl = document.getElementById('search-results-info');

  if (!searchInput || !noResultsEl || !clearBtn || !resultsInfoEl) return;

  // Update clear button visibility based on input value
  function updateClearButton() {
    clearBtn.style.display = searchInput.value.length > 0 ? 'block' : 'none';
  }

  // Initialize clear button state
  updateClearButton();

  searchInput.addEventListener('input', () => {
    updateClearButton();
    const query = searchInput.value.toLowerCase().trim();
    const leaderboardRows = document.querySelectorAll('.leaderboard-row');
    const submitterRows = document.querySelectorAll('.submitter-row');
    const allRows = document.querySelectorAll('.leaderboard-row, .submitter-row');

    if (!query) {
      // Clear search state - show all rows normally
      allRows.forEach(row => {
        row.classList.remove('search-match', 'search-dimmed');
      });
      noResultsEl.style.display = 'none';
      resultsInfoEl.style.display = 'none';
      return;
    }

    let matchCount = 0;
    let earnerRank: number | null = null;
    let submitterRank: number | null = null;

    // Find rank in leaderboard (earners)
    leaderboardRows.forEach((row, index) => {
      const addressEl = row.querySelector('.address[data-full-address]');
      if (!addressEl) return;

      const fullAddress = addressEl.getAttribute('data-full-address')?.toLowerCase() || '';

      if (fullAddress.includes(query)) {
        row.classList.add('search-match');
        row.classList.remove('search-dimmed');
        matchCount++;
        if (earnerRank === null) earnerRank = index + 1; // 1-indexed
      } else {
        row.classList.remove('search-match');
        row.classList.add('search-dimmed');
      }
    });

    // Find rank in submitters
    submitterRows.forEach((row, index) => {
      const addressEl = row.querySelector('.address[data-full-address]');
      if (!addressEl) return;

      const fullAddress = addressEl.getAttribute('data-full-address')?.toLowerCase() || '';

      if (fullAddress.includes(query)) {
        row.classList.add('search-match');
        row.classList.remove('search-dimmed');
        matchCount++;
        if (submitterRank === null) submitterRank = index + 1; // 1-indexed
      } else {
        row.classList.remove('search-match');
        row.classList.add('search-dimmed');
      }
    });

    // Show/hide no results message and rank info
    if (matchCount === 0) {
      noResultsEl.style.display = 'block';
      resultsInfoEl.style.display = 'none';
    } else {
      noResultsEl.style.display = 'none';

      // Build rank info string
      const parts: string[] = [];
      if (earnerRank !== null) {
        parts.push(`Rank <span class="rank-number">#${earnerRank}</span> of ${leaderboardRows.length} earners`);
      }
      if (submitterRank !== null) {
        parts.push(`Rank <span class="rank-number">#${submitterRank}</span> of ${submitterRows.length} submitters`);
      }

      resultsInfoEl.innerHTML = `Found: ${parts.join(' &bull; ')}`;
      resultsInfoEl.style.display = 'block';
    }
  });

  // Clear button click handler
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));
    searchInput.focus();
  });
}

init();
