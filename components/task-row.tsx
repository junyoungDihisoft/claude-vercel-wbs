'use client';

import { Badge, Button, HStack, Table } from '@chakra-ui/react';
import type { Task } from '@/lib/types';

const STATUS_CONFIG = {
  todo: { label: '할 일', colorPalette: 'gray' },
  doing: { label: '진행 중', colorPalette: 'blue' },
  done: { label: '완료', colorPalette: 'green' },
} as const;

interface TaskRowProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskRow({ task, onEdit, onDelete }: TaskRowProps) {
  const statusConfig =
    STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] ??
    STATUS_CONFIG.todo;

  return (
    <Table.Row>
      <Table.Cell>{task.title}</Table.Cell>
      <Table.Cell>{task.assignee ?? '-'}</Table.Cell>
      <Table.Cell>
        <Badge colorPalette={statusConfig.colorPalette} size="sm">
          {statusConfig.label}
        </Badge>
      </Table.Cell>
      <Table.Cell>{task.progress}%</Table.Cell>
      <Table.Cell>{task.startDate ?? '-'}</Table.Cell>
      <Table.Cell>{task.dueDate ?? '-'}</Table.Cell>
      <Table.Cell>
        <HStack gap={2}>
          <Button size="xs" variant="outline" onClick={() => onEdit(task)}>
            편집
          </Button>
          <Button
            size="xs"
            variant="outline"
            colorPalette="red"
            onClick={() => onDelete(task)}
          >
            삭제
          </Button>
        </HStack>
      </Table.Cell>
    </Table.Row>
  );
}
