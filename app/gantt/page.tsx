import { Container } from '@chakra-ui/react';
import { asc } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { AppHeader } from '@/components/app-header';
import { GanttBoard } from '@/components/gantt-board';
import { buildTaskTree } from '@/lib/tree/build-task-tree';
import { getTodayIso } from '@/lib/dates/today-iso';

export const dynamic = 'force-dynamic';

export default async function GanttPage() {
  const db = getDb();
  const allTasks = await db.select().from(tasks).orderBy(asc(tasks.createdAt));
  const tree = buildTaskTree(allTasks);

  return (
    <>
      <AppHeader />
      <Container maxW="6xl" py={8}>
        <GanttBoard nodes={tree} todayIso={getTodayIso()} />
      </Container>
    </>
  );
}
