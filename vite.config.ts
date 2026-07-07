import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pagesへのデプロイ時はリポジトリ名をbaseにする(GitHub Actionsで GHPAGES=true を設定)
const isGhPages = process.env.GHPAGES === 'true'

// https://vite.dev/config/
export default defineConfig({
  base: isGhPages ? '/chinese-trainer/' : './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Chinese Trainer',
        short_name: '中文Trainer',
        description: '個人用中国語学習アプリ - 聞き流し・瞬発練習・SRS復習',
        theme_color: '#b91c1c',
        background_color: '#faf7f2',
        display: 'standalone',
        start_url: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}']
      }
    })
  ]
})
