import { Container, Text } from '@chakra-ui/react';
import { asc } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { AppHeader } from '@/components/app-header';
import { buildTaskTree } from '@/lib/tree/build-task-tree';

export const dynamic = 'force-dynamic';

export default async function GanttPage() {
  const db = getDb();
  const allTasks = await db.select().from(tasks).orderBy(asc(tasks.createdAt));
  void buildTaskTree(allTasks);

  return (
    <>
      <AppHeader />
      <Container maxW="6xl" py={8}>
        <Text color="gray.500">간트 보드는 다음 슬라이스에서 추가됩니다.</Text>
      </Container>
    </>
  );
}
