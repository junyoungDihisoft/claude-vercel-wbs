import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

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

// `server-only` 는 클라이언트 컴포넌트 빌드 시점에 throw 하도록 설계된
// 가드 모듈이다. Next 의 react-server condition 밖(=vitest)에서는 default
// 엔트리가 곧바로 throw 하므로, 단위 테스트에서는 no-op 으로 모킹해
// 서버 전용 모듈을 import 가능하게 한다. (가드 본연의 역할은 Next 빌드가 담당)
vi.mock('server-only', () => ({}));
