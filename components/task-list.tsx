'use client';

import { Box, Button, HStack, Table, Text } from '@chakra-ui/react';
import { useRef, useState } from 'react';
import { TaskRow } from './task-row';
import { TaskFormModal } from './task-form-modal';
import { DeleteConfirmDialog } from './delete-confirm-dialog';
import { CsvImportModal } from './csv-import-modal';
import { countChildren } from '@/app/actions/tasks';
import { buildCsv } from '@/lib/csv/build';
import { parseCsv } from '@/lib/csv/parse';
import type { ParsedCsv } from '@/lib/csv/types';
import type { Task } from '@/lib/types';
import type { TaskNode } from '@/lib/tree/build-task-tree';

interface TaskListProps {
  nodes: TaskNode[];
}

export function TaskList({ nodes }: TaskListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [parentId, setParentId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [childCount, setChildCount] = useState(0);
  // 접힌 부모 id 셋 (클라이언트 state, 새로고침 시 초기화)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [parsedCsv, setParsedCsv] = useState<ParsedCsv | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddClick = () => {
    setParentId(null);
    setEditingTask(undefined);
    setIsFormOpen(true);
  };

  const handleAddSubtask = (parent: Task) => {
    setParentId(parent.id);
    setEditingTask(undefined);
    setIsFormOpen(true);
  };

  const handleEditClick = (task: Task) => {
    setParentId(null);
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleDeleteClick = async (task: Task) => {
    setDeletingTask(task);
    const count = await countChildren(task.id);
    setChildCount(count);
    setIsDeleteOpen(true);
  };

  const handleToggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTask(undefined);
    setParentId(null);
  };

  const handleDeleteClose = () => {
    setIsDeleteOpen(false);
    setDeletingTask(null);
    setChildCount(0);
  };

  const handleExportClick = () => {
    const csv = buildCsv(nodes);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wbs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // 같은 파일 재선택 허용
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const existingTitles = new Set(nodes.map((n) => n.task.title));
      const result = parseCsv(text, existingTitles);
      setParsedCsv(result);
    };
    reader.readAsText(file, 'utf-8');
  };

  // 조상 중 하나라도 접혀 있으면 해당 행은 렌더 스킵
  // nodes는 DFS 순서이므로 앞에 나온 부모가 collapsed에 있으면 자손을 가린다.
  // 각 노드의 task.parentId 체인을 거슬러 올라가는 대신, DFS 순서를 이용해
  // "현재 숨김 깊이"를 추적하는 O(n) 방식을 씀.
  const visibleNodes: TaskNode[] = [];
  let hiddenDepth: number | null = null;

  for (const node of nodes) {
    if (hiddenDepth !== null && node.depth > hiddenDepth) continue;
    hiddenDepth = null;

    if (collapsed.has(node.task.id)) {
      hiddenDepth = node.depth;
    }
    visibleNodes.push(node);
  }

  return (
    <Box>
      <HStack mb={4} gap={2}>
        <Button size="sm" colorPalette="blue" onClick={handleAddClick}>
          + 작업 추가
        </Button>
        <Button size="sm" variant="outline" onClick={handleExportClick}>
          CSV 내보내기
        </Button>
        <Button size="sm" variant="outline" onClick={handleImportClick}>
          CSV 불러오기
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </HStack>

      {nodes.length === 0 ? (
        <Box textAlign="center" py={16} color="gray.500">
          <Text fontSize="lg">아직 작업이 없습니다. 첫 작업을 추가해 시작하세요</Text>
        </Box>
      ) : (
        <Table.Root size="sm" variant="line">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader w="32px" />
              <Table.ColumnHeader>제목</Table.ColumnHeader>
              <Table.ColumnHeader>담당자</Table.ColumnHeader>
              <Table.ColumnHeader>상태</Table.ColumnHeader>
              <Table.ColumnHeader>진행률</Table.ColumnHeader>
              <Table.ColumnHeader>시작일</Table.ColumnHeader>
              <Table.ColumnHeader>기한</Table.ColumnHeader>
              <Table.ColumnHeader />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {visibleNodes.map(({ task, depth, hasChildren }) => (
              <TaskRow
                key={task.id}
                task={task}
                depth={depth}
                hasChildren={hasChildren}
                isCollapsed={collapsed.has(task.id)}
                onToggleCollapse={handleToggleCollapse}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                onAddSubtask={handleAddSubtask}
              />
            ))}
          </Table.Body>
        </Table.Root>
      )}

      {isFormOpen && (
        <TaskFormModal
          key={editingTask?.id ?? `new-${parentId}`}
          isOpen={isFormOpen}
          onClose={handleFormClose}
          task={editingTask}
          parentId={parentId}
        />
      )}

      {isDeleteOpen && (
        <DeleteConfirmDialog
          isOpen={isDeleteOpen}
          onClose={handleDeleteClose}
          task={deletingTask}
          childCount={childCount}
        />
      )}

      {parsedCsv && (
        <CsvImportModal
          parsed={parsedCsv}
          onClose={() => setParsedCsv(null)}
        />
      )}
    </Box>
  );
}
