export type TaskStatus = 'todo' | 'doing' | 'done';

export type Task = {
  id: string;
  parentId: string | null;
  title: string;
  description: string | null;
  assignee: string | null;
  status: string;
  progress: number;
  startDate: string | null;
  dueDate: string | null;
  createdAt: Date;
  updatedAt: Date;
};
