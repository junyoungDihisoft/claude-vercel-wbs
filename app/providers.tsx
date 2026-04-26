'use client';

import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  // Chakra v3 + next-themes 공식 권장 순서: ThemeProvider 가 바깥에서
  // html.class 를 토글하면 안쪽 ChakraProvider 의 color-mode 토큰이
  // 그 클래스에 맞춰 즉시 전환된다.
  return (
    <ThemeProvider attribute="class" disableTransitionOnChange>
      <ChakraProvider value={defaultSystem}>{children}</ChakraProvider>
    </ThemeProvider>
  );
}
