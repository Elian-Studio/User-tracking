import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// render()의 바운드 쿼리(getByText 등)는 기본적으로 document.body 전체를 대상으로 하므로,
// 테스트마다 언마운트하지 않으면 이전 테스트의 DOM이 남아 쿼리가 여러 개를 찾는 오류가 난다.
afterEach(() => {
  cleanup();
});
