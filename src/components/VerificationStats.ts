import type { AnalyticsData } from '../types';

export function renderVerificationStats(container: HTMLElement, data: AnalyticsData): void {
  const successRate = data.verificationSuccessRate.toFixed(1);
  const avgScore = data.averageRewardScore.toFixed(1);

  container.innerHTML = `
    <h2>Verification Stats</h2>
    <div class="stats-list">
      <div class="stat-row">
        <div class="stat-label">Success Rate</div>
        <div class="stat-value highlight">${successRate}%</div>
      </div>
      <div class="stat-row">
        <div class="stat-label">Avg Reward Score</div>
        <div class="stat-value">${avgScore}</div>
      </div>
      <div class="stat-row">
        <div class="stat-label">Tasks Rewarded</div>
        <div class="stat-value">${data.tasksByStatus.rewarded || 0}</div>
      </div>
      <div class="stat-row">
        <div class="stat-label">Tasks Refused</div>
        <div class="stat-value" style="color: var(--error);">${data.tasksByStatus.refused || 0}</div>
      </div>
    </div>
  `;
}
