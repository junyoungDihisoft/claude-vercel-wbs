'use client';

import {
  Badge,
  Button,
  CloseButton,
  Dialog,
  List,
  Portal,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { importTasksFromCsv } from '@/app/actions/csv';
import type { ParsedCsv } from '@/lib/csv/types';

interface CsvImportModalProps {
  parsed: ParsedCsv;
  onClose: () => void;
}

export function CsvImportModal({ parsed, onClose }: CsvImportModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApply = async () => {
    setLoading(true);
    setError('');
    const result = await importTasksFromCsv(parsed.rows);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
    onClose();
  };

  return (
    <Dialog.Root
      lazyMount
      unmountOnExit
      open
      onOpenChange={(e) => {
        if (!e.open) onClose();
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>CSV 가져오기 미리보기</Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body pb={4}>
              <Stack gap={4}>
                {error && (
                  <Text color="red.500" fontSize="sm">
                    {error}
                  </Text>
                )}
                <Text fontWeight="semibold">
                  {parsed.rows.length}개 작업을 추가합니다. 제외 {parsed.skipped.length}건
                </Text>

                {parsed.skipped.length > 0 && (
                  <Stack gap={1}>
                    <Text fontSize="sm" color="red.600" fontWeight="medium">
                      제외 항목
                    </Text>
                    <List.Root>
                      {parsed.skipped.map((s) => (
                        <List.Item key={s.rowIndex} fontSize="sm" color="red.500">
                          {s.rowIndex}행: {s.reason}
                        </List.Item>
                      ))}
                    </List.Root>
                  </Stack>
                )}

                {parsed.warnings.length > 0 && (
                  <Stack gap={1}>
                    <Text fontSize="sm" color="orange.600" fontWeight="medium">
                      경고
                    </Text>
                    <List.Root>
                      {parsed.warnings.map((w, i) => (
                        <List.Item key={i} fontSize="sm" color="orange.500">
                          {w.rowIndex}행 ({w.field}): {w.message}
                        </List.Item>
                      ))}
                    </List.Root>
                  </Stack>
                )}

                {parsed.rows.length > 0 && (
                  <Stack gap={1}>
                    <Text fontSize="sm" color="gray.600" fontWeight="medium">
                      추가될 작업
                    </Text>
                    <List.Root>
                      {parsed.rows.map((r, i) => (
                        <List.Item key={i} fontSize="sm">
                          {r.title}
                          {r.parentTitle && (
                            <Badge ml={2} size="sm" variant="outline">
                              {r.parentTitle} 하위
                            </Badge>
                          )}
                        </List.Item>
                      ))}
                    </List.Root>
                  </Stack>
                )}
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={onClose}>
                취소
              </Button>
              <Button
                colorPalette="blue"
                loading={loading}
                disabled={parsed.rows.length === 0}
                onClick={handleApply}
              >
                적용
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
