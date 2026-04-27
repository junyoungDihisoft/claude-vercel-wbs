import { Container, Heading } from '@chakra-ui/react';
import { asc } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { TaskList } from '@/components/task-list';

export default async function HomePage() {
  const db = getDb();
  const allTasks = await db.select().from(tasks).orderBy(asc(tasks.createdAt));

  return (
    <Container maxW="5xl" py={8}>
      <Heading as="h1" size="2xl" mb={6}>
        WBS
      </Heading>
      <TaskList tasks={allTasks} />
    </Container>
  );
}
