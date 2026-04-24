import { Container, Heading, Text, VStack } from '@chakra-ui/react';

export default function HomePage() {
  return (
    <Container maxW="3xl" py={16}>
      <VStack align="stretch" gap={4}>
        <Heading as="h1" size="2xl">
          WBS
        </Heading>
        <Text color="fg.muted">
          아직 작업이 없습니다. 첫 작업을 추가해 시작하세요.
        </Text>
      </VStack>
    </Container>
  );
}
