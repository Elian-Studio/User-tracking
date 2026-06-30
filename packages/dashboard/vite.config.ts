import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // recharts(약 537KB)는 알려진 대형 벤더라 별도 청크로 분리한다.
    // 경고 한도를 올려 이 청크에 대한 cry-wolf 경고를 끈다.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // 무거운 차트 라이브러리를 벤더 청크로 분리 → 메인 청크 축소 + 캐시 효율
        manualChunks: {
          recharts: ["recharts"],
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:3100",
    },
  },
});
