import { Container } from '@chakra-ui/react';
import { asc } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { AppHeader } from '@/components/app-header';
import { GanttBoard } from '@/components/gantt-board';
import { PageHeader } from '@/components/page-header';
import { StatsStrip } from '@/components/stats-strip';
import { buildTaskTree } from '@/lib/tree/build-task-tree';
import { getTodayIso } from '@/lib/dates/today-iso';
import { computeStats } from '@/lib/stats/compute-stats';

export const dynamic = 'force-dynamic';

export default async function GanttPage() {
  const db = getDb();
  const allTasks = await db.select().from(tasks).orderBy(asc(tasks.createdAt));
  const tree = buildTaskTree(allTasks);
  const todayIso = getTodayIso();
  const stats = computeStats(allTasks, todayIso);

  return (
    <>
      <AppHeader />
      <Container maxW="6xl" py={8}>
        <PageHeader todayIso={todayIso} stats={stats} />
        <StatsStrip stats={stats} />
        <GanttBoard nodes={tree} todayIso={todayIso} />
      </Container>
    </>
  );
}
