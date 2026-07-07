// 画面全体のレイアウト
// PC: 左サイドバーに全画面へのナビゲーション
// スマホ: 上部ヘッダー + 下部固定ナビ(主要5つ) + その他メニュー
import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

interface NavItem {
  to: string
  icon: string
  label: string
}

const MAIN_NAV: NavItem[] = [
  { to: '/', icon: '🏠', label: 'ホーム' },
  { to: '/items', icon: '📚', label: '教材' },
  { to: '/listen', icon: '🎧', label: '聞き流し' },
  { to: '/flash', icon: '⚡', label: '瞬発' },
]

const STUDY_NAV: NavItem[] = [
  { to: '/srs', icon: '🔁', label: 'SRS復習' },
  { to: '/articles', icon: '📰', label: '長文' },
  { to: '/queue', icon: '📋', label: '学習キュー' },
]

const LIBRARY_NAV: NavItem[] = [
  { to: '/packs', icon: '📦', label: '教材パック' },
  { to: '/playlists', icon: '🎵', label: 'プレイリスト' },
  { to: '/rss', icon: '📡', label: 'RSS' },
  { to: '/paste', icon: '📝', label: '貼り付け読み上げ' },
  { to: '/prompt', icon: '🤖', label: '教材生成プロンプト' },
]

const OTHER_NAV: NavItem[] = [
  { to: '/history', icon: '📈', label: '学習履歴' },
  { to: '/settings', icon: '⚙️', label: '設定' },
]

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  const navLink = (item: NavItem) => (
    <NavLink
      key={item.to}
      to={item.to}
      className={({ isActive }) => (isActive ? 'active' : '')}
      onClick={() => setMenuOpen(false)}
      end={item.to === '/'}
    >
      <span className="nav-icon">{item.icon}</span>
      <span>{item.label}</span>
    </NavLink>
  )

  // その他メニュー内のいずれかの画面を開いているか
  const inOtherPages = [...STUDY_NAV, ...LIBRARY_NAV, ...OTHER_NAV].some(
    (n) => location.pathname.startsWith(n.to) && n.to !== '/'
  )

  return (
    <div className="app-layout">
      {/* PCサイドバー */}
      <nav className="sidebar">
        <NavLink to="/" className="brand">
          中 Chinese Trainer
        </NavLink>
        {MAIN_NAV.map(navLink)}
        <div className="nav-group-label">学習</div>
        {STUDY_NAV.map(navLink)}
        <div className="nav-group-label">ライブラリ</div>
        {LIBRARY_NAV.map(navLink)}
        <div className="nav-group-label">その他</div>
        {OTHER_NAV.map(navLink)}
      </nav>

      <div className="main-content">
        {/* モバイルヘッダー */}
        <header className="mobile-header">
          <NavLink to="/" className="brand">
            中 Chinese Trainer
          </NavLink>
        </header>

        <Outlet />
      </div>

      {/* モバイルメニューオーバーレイ */}
      {menuOpen && (
        <div className="menu-overlay">
          <div className="page-title">メニュー</div>
          <div className="menu-grid">
            {[...STUDY_NAV, ...LIBRARY_NAV, ...OTHER_NAV].map((item) => (
              <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)}>
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* モバイル下部ナビ */}
      <nav className="bottom-nav">
        {MAIN_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive && !menuOpen ? 'active' : '')}
            onClick={() => setMenuOpen(false)}
            end={item.to === '/'}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          style={menuOpen || inOtherPages ? { color: 'var(--accent)', fontWeight: 700 } : undefined}
        >
          <span className="nav-icon">☰</span>
          <span>メニュー</span>
        </button>
      </nav>
    </div>
  )
}
