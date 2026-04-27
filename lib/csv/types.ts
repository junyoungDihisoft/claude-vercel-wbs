export type ParsedRow = {
  title: string;
  description: string | null;
  assignee: string | null;
  status: 'todo' | 'doing' | 'done';
  progress: number;
  startDate: string | null;
  dueDate: string | null;
  parentTitle: string | null;
};

export type Skipped = {
  rowIndex: number; // 1-based data row index (not counting header)
  reason: string;
};

export type Warning = {
  rowIndex: number;
  field: string;
  message: string;
};

export type ParsedCsv = {
  rows: ParsedRow[];
  skipped: Skipped[];
  warnings: Warning[];
};
