'use client';

import { Badge, Box, Button, HStack, Table, Text } from '@chakra-ui/react';
import type { Task } from '@/lib/types';

const STATUS_CONFIG = {
  todo: { label: '할 일', colorPalette: 'gray' },
  doing: { label: '진행 중', colorPalette: 'blue' },
  done: { label: '완료', colorPalette: 'green' },
} as const;

interface TaskRowProps {
  task: Task;
  depth: number;
  hasChildren: boolean;
  isCollapsed: boolean;
  onToggleCollapse: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onAddSubtask: (task: Task) => void;
}

export function TaskRow({
  task,
  depth,
  hasChildren,
  isCollapsed,
  onToggleCollapse,
  onEdit,
  onDelete,
  onAddSubtask,
}: TaskRowProps) {
  const statusConfig =
    STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] ??
    STATUS_CONFIG.todo;

  const toggleIcon = hasChildren ? (isCollapsed ? '▶' : '▼') : null;

  return (
    <Table.Row>
      {/* 펼침/접힘 아이콘 컬럼 — 항상 동일 폭 유지 */}
      <Table.Cell w="32px" p={0} textAlign="center">
        {toggleIcon ? (
          <Button
            size="xs"
            variant="ghost"
            aria-label={isCollapsed ? '펼치기' : '접기'}
            onClick={() => onToggleCollapse(task.id)}
          >
            {toggleIcon}
          </Button>
        ) : null}
      </Table.Cell>
      {/* 제목: depth × 24px 들여쓰기 */}
      <Table.Cell>
        <Box pl={`${depth * 24}px`}>
          <Text>{task.title}</Text>
        </Box>
      </Table.Cell>
      <Table.Cell>{task.assignee ?? '—'}</Table.Cell>
      <Table.Cell>
        <Badge colorPalette={statusConfig.colorPalette} size="sm">
          {statusConfig.label}
        </Badge>
      </Table.Cell>
      <Table.Cell>{task.progress}%</Table.Cell>
      <Table.Cell>{task.startDate ?? '—'}</Table.Cell>
      <Table.Cell>{task.dueDate ?? '—'}</Table.Cell>
      <Table.Cell>
        <HStack gap={1}>
          <Button size="xs" variant="outline" onClick={() => onEdit(task)}>
            편집
          </Button>
          <Button size="xs" variant="outline" onClick={() => onAddSubtask(task)}>
            + 하위
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
