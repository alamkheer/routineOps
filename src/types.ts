import { LucideIcon } from 'lucide-react';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Severity = 'MINIMAL' | 'MINOR' | 'WORKFLOW_BLOCK' | 'SYSTEM_FAILURE';

export interface Task {
  id: string;
  name: string;
  description: string;
  isRoutine: boolean;
  frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  priority: number; // 0-100
  severity: number; // 0-100
  dependencies: string[]; // IDs of blocked tasks
  isCompleted: boolean;
  createdAt: number;
}

export type Screen = 'MATRIX' | 'LISTS' | 'ANALYTICS' | 'NEW_TASK';

export interface SystemLog {
  id: string;
  timestamp: number;
  message: string;
  type: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
}
