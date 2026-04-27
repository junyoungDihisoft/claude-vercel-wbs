'use client';

import { Box, Button, HStack, Table, Text } from '@chakra-ui/react';
import { useState } from 'react';
import { TaskRow } from './task-row';
import { TaskFormModal } from './task-form-modal';
import { DeleteConfirmDialog } from './delete-confirm-dialog';
import { countChildren } from '@/app/actions/tasks';
import type { Task } from '@/lib/types';

interface TaskListProps {
  tasks: Task[];
}

export function TaskList({ tasks }: TaskListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [childCount, setChildCount] = useState(0);

  const handleAddClick = () => {
    setEditingTask(undefined);
    setIsFormOpen(true);
  };

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleDeleteClick = async (task: Task) => {
    setDeletingTask(task);
    const count = await countChildren(task.id);
    setChildCount(count);
    setIsDeleteOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTask(undefined);
  };

  const handleDeleteClose = () => {
    setIsDeleteOpen(false);
    setDeletingTask(null);
    setChildCount(0);
  };

  return (
    <Box>
      <HStack mb={4} gap={2}>
        <Button size="sm" colorPalette="blue" onClick={handleAddClick}>
          + 작업 추가
        </Button>
        <Button size="sm" variant="outline" disabled>
          CSV 내보내기
        </Button>
        <Button size="sm" variant="outline" disabled>
          CSV 불러오기
        </Button>
      </HStack>

      {tasks.length === 0 ? (
        <Box textAlign="center" py={16} color="gray.500">
          <Text fontSize="lg">아직 작업이 없습니다.</Text>
          <Text fontSize="sm" mt={2}>
            + 작업 추가로 시작해 보세요.
          </Text>
        </Box>
      ) : (
        <Table.Root size="sm" variant="line">
          <Table.Header>
            <Table.Row>
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
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
              />
            ))}
          </Table.Body>
        </Table.Root>
      )}

      {isFormOpen && (
        <TaskFormModal
          key={editingTask?.id ?? 'new'}
          isOpen={isFormOpen}
          onClose={handleFormClose}
          task={editingTask}
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
    </Box>
  );
}
