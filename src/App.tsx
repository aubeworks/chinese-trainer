// アプリのルート: ルーティングとテーマ適用
import { useEffect } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ItemsPage from './pages/ItemsPage'
import ItemEditPage from './pages/ItemEditPage'
import PacksPage from './pages/PacksPage'
import PlaylistsPage from './pages/PlaylistsPage'
import QueuePage from './pages/QueuePage'
import ListenPage from './pages/ListenPage'
import FlashPage from './pages/FlashPage'
import ArticlesPage from './pages/ArticlesPage'
import RssPage from './pages/RssPage'
import PastePage from './pages/PastePage'
import PromptPage from './pages/PromptPage'
import SettingsPage from './pages/SettingsPage'
import HistoryPage from './pages/HistoryPage'
import SrsPage from './pages/SrsPage'
import { useApp } from './store/AppContext'

export default function App() {
  const { loading, settings } = useApp()

  // テーマ適用(auto はOS設定に追従)
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = settings.theme === 'dark' || (settings.theme === 'auto' && media.matches)
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [settings.theme])

  if (loading) {
    return <div className="loading-screen">読み込み中…</div>
  }

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/items" element={<ItemsPage />} />
          <Route path="/items/:id" element={<ItemEditPage />} />
          <Route path="/packs" element={<PacksPage />} />
          <Route path="/playlists" element={<PlaylistsPage />} />
          <Route path="/queue" element={<QueuePage />} />
          <Route path="/listen" element={<ListenPage />} />
          <Route path="/flash" element={<FlashPage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/rss" element={<RssPage />} />
          <Route path="/paste" element={<PastePage />} />
          <Route path="/prompt" element={<PromptPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/srs" element={<SrsPage />} />
          <Route path="*" element={<HomePage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
