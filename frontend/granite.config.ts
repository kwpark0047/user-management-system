import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  // 앱 이름 (앱인토스 식별자)
  appName: 'wemarket-qr-menu',

  // 웹 서버 설정
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'npm run dev',
      build: 'npm run build',
    },
  },

  // 필요한 권한 (나중에 추가 가능)
  permissions: [],

  // 빌드 출력 디렉터리
  outdir: 'dist',

  // 브랜드 설정
  brand: {
    displayName: '위마켓 QR 메뉴',
    icon: 'https://static.toss.im/icons/png/4x/icon-food-outlined.png',
    primaryColor: '#4F46E5',
    bridgeColorMode: 'inverted',
  },

  // WebView 설정
  webViewProps: {
    type: 'partner',
  },
});
