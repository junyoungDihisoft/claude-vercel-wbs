'use client';

import {
  Button,
  CloseButton,
  Dialog,
  Field,
  Input,
  NativeSelect,
  NumberInput,
  Portal,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { createTask, updateTask, type TaskFormData } from '@/app/actions/tasks';
import type { Task } from '@/lib/types';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task;
}

export function TaskFormModal({ isOpen, onClose, task }: TaskFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('');
  const [status, setStatus] = useState<'todo' | 'doing' | 'done'>('todo');
  const [progress, setProgress] = useState('0');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(task?.title ?? '');
      setDescription(task?.description ?? '');
      setAssignee(task?.assignee ?? '');
      setStatus((task?.status as 'todo' | 'doing' | 'done') ?? 'todo');
      setProgress(String(task?.progress ?? 0));
      setStartDate(task?.startDate ?? '');
      setDueDate(task?.dueDate ?? '');
      setError('');
    }
  }, [isOpen, task]);

  const handleSubmit = async () => {
    setError('');
    if (!title.trim()) {
      setError('제목을 입력해 주세요.');
      return;
    }
    if (startDate && dueDate && startDate > dueDate) {
      setError('목표 기한은 시작일 이후여야 합니다.');
      return;
    }

    setLoading(true);
    const data: TaskFormData = {
      title,
      description: description || null,
      assignee: assignee || null,
      status,
      progress: Number(progress) || 0,
      startDate: startDate || null,
      dueDate: dueDate || null,
    };

    const result = task ? await updateTask(task.id, data) : await createTask(data);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    onClose();
  };

  const hasDateError = !!(startDate && dueDate && startDate > dueDate);

  return (
    <Dialog.Root
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
              <Dialog.Title>{task ? '작업 수정' : '작업 추가'}</Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body pb={6}>
              <Stack gap={4}>
                {error && (
                  <Text color="red.500" fontSize="sm">
                    {error}
                  </Text>
                )}
                <Field.Root required>
                  <Field.Label>
                    제목 <Field.RequiredIndicator />
                  </Field.Label>
                  <Input
                    placeholder="작업 제목"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>설명</Field.Label>
                  <Textarea
                    placeholder="작업 설명"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>담당자</Field.Label>
                  <Input
                    placeholder="담당자 이름"
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                  />
                </Field.Root>
                <Field.Root>
                  <Field.Label>상태</Field.Label>
                  <NativeSelect.Root>
                    <NativeSelect.Field
                      value={status}
                      onChange={(e) =>
                        setStatus(e.target.value as 'todo' | 'doing' | 'done')
                      }
                    >
                      <option value="todo">할 일</option>
                      <option value="doing">진행 중</option>
                      <option value="done">완료</option>
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Field.Root>
                <Field.Root>
                  <Field.Label>진행률 (0~100)</Field.Label>
                  <NumberInput.Root
                    min={0}
                    max={100}
                    value={progress}
                    onValueChange={(e) => setProgress(e.value)}
                    width="100%"
                  >
                    <NumberInput.Control />
                    <NumberInput.Input />
                  </NumberInput.Root>
                </Field.Root>
                <Field.Root invalid={hasDateError}>
                  <Field.Label>시작일</Field.Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </Field.Root>
                <Field.Root invalid={hasDateError}>
                  <Field.Label>목표 기한</Field.Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                  {hasDateError && (
                    <Field.ErrorText>
                      목표 기한은 시작일 이후여야 합니다.
                    </Field.ErrorText>
                  )}
                </Field.Root>
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={onClose}>
                취소
              </Button>
              <Button colorPalette="blue" loading={loading} onClick={handleSubmit}>
                {task ? '수정' : '추가'}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
