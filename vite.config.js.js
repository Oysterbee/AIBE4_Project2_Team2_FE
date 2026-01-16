import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    // 프록시 설정: '/api'로 시작하는 요청을 백엔드(8080)로 전달
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});