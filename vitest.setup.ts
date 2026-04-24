import '@testing-library/jest-dom/vitest';

// jsdom 은 matchMedia 를 구현하지 않는다. next-themes 가 SSR/CSR 양쪽에서
// 이 API 를 호출하므로 단위 테스트에서 최소 stub 을 둔다.
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
