'use client';

import { Button, Dialog, Portal, Text } from '@chakra-ui/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteTask } from '@/app/actions/tasks';
import type { Task } from '@/lib/types';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  childCount: number;
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  task,
  childCount,
}: DeleteConfirmDialogProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!task) return;
    setLoading(true);
    await deleteTask(task.id);
    setLoading(false);
    onClose();
    // 다이얼로그 close 애니메이션(~200ms)이 끝난 뒤 DOM을 갱신해
    // focus-trap 정리 전에 트리거 요소가 사라지는 문제를 방지한다.
    setTimeout(() => router.refresh(), 300);
  };

  const message =
    childCount > 0
      ? `'${task?.title}' 작업과 하위 작업 ${childCount}개가 함께 삭제됩니다. 계속하시겠습니까?`
      : `'${task?.title}' 작업을 삭제하시겠습니까?`;

  return (
    <Dialog.Root
      role="alertdialog"
      lazyMount
      unmountOnExit
      open={isOpen}
      onOpenChange={(e) => {
        if (!e.open) onClose();
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>작업 삭제</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text>{message}</Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={onClose}>
                취소
              </Button>
              <Button colorPalette="red" loading={loading} onClick={handleDelete}>
                삭제
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
