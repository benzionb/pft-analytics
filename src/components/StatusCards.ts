import type { AnalyticsData, TaskStatus } from '../types';

const STATUS_ORDER: TaskStatus[] = ['outstanding', 'pending', 'rewarded', 'refused', 'cancelled'];

const STATUS_LABELS: Record<TaskStatus, string> = {
  outstanding: 'Outstanding',
  pending: 'Pending',
  rewarded: 'Rewarded',
  refused: 'Refused',
  cancelled: 'Cancelled',
};

export function renderStatusCards(container: HTMLElement, data: AnalyticsData): void {
  const cardsHtml = STATUS_ORDER.map((status) => {
    const count = data.tasksByStatus[status] || 0;
    return `
      <div class="card ${status}">
        <div class="value">${count}</div>
        <div class="label">${STATUS_LABELS[status]}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <h2>Tasks by Status</h2>
    <div class="cards-grid">
      ${cardsHtml}
    </div>
    <div class="card" style="margin-top: 1rem; grid-column: 1 / -1;">
      <div class="value">${data.totalTasks}</div>
      <div class="label">Total Tasks</div>
    </div>
  `;
}
