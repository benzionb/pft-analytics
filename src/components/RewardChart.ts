import type { AnalyticsData, RewardTier } from '../types';

const TIER_ORDER: RewardTier[] = ['exceptional', 'very_good', 'good', 'average', 'minimal'];

const TIER_LABELS: Record<RewardTier, string> = {
  exceptional: 'Exceptional',
  very_good: 'Very Good',
  good: 'Good',
  average: 'Average',
  minimal: 'Minimal',
};

export function renderRewardChart(container: HTMLElement, data: AnalyticsData): void {
  // Find max count for scaling bars
  const maxCount = Math.max(...Object.values(data.rewardsByTier), 1);

  const barsHtml = TIER_ORDER.map((tier) => {
    const count = data.rewardsByTier[tier] || 0;
    const widthPercent = (count / maxCount) * 100;

    return `
      <div class="bar-row">
        <div class="bar-label">${TIER_LABELS[tier]}</div>
        <div class="bar-container">
          <div class="bar-fill ${tier}" style="width: ${widthPercent}%"></div>
        </div>
        <div class="bar-value">${count}</div>
      </div>
    `;
  }).join('');

  // Format PFT with commas
  const formattedPft = data.totalPftRewarded.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  container.innerHTML = `
    <h2>Reward Distribution</h2>
    <div class="bar-chart">
      ${barsHtml}
    </div>
    <div class="stat-row" style="margin-top: 1.5rem;">
      <div class="stat-label">Total PFT Rewarded</div>
      <div class="stat-value">${formattedPft}</div>
    </div>
  `;
}
