// Task status types
export type TaskStatus = 'outstanding' | 'pending' | 'rewarded' | 'refused' | 'cancelled';

// Reward tier types
export type RewardTier = 'exceptional' | 'very_good' | 'good' | 'average' | 'minimal';

// Task summary from API
export interface TaskSummary {
  status: TaskStatus;
  count: number;
}

// Individual task data
export interface Task {
  id: string;
  title: string;
  type: 'personal' | 'network' | 'alpha';
  status: TaskStatus;
  pft: string;
  rewardTier: RewardTier | null;
  rewardScore: string | null;
  createdAt: number;
  rewardedAt: number | null;
  verificationStatus: string | null;
}

// Aggregated analytics data
export interface AnalyticsData {
  tasksByStatus: Record<TaskStatus, number>;
  rewardsByTier: Record<RewardTier, number>;
  totalPftRewarded: number;
  averageRewardScore: number;
  verificationSuccessRate: number;
  totalTasks: number;
  lastUpdated: Date;
}
