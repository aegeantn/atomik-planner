// App.jsx — Uygulama kabuğu: header + sekme navigasyonu + içerik

import { useState } from 'react'
import Logo from './components/Logo'
import Dashboard from './components/Dashboard'
import IdentityCard from './components/IdentityCard'
import HabitScorecard from './components/HabitScorecard'
import HabitTracker from './components/HabitTracker'
import DailySchedule from './components/DailySchedule'
import EveningReview from './components/EveningReview'
import ProgressView from './components/ProgressView'

function todayTurkish() {
  return new Date().toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// --- Sekmeler ---
const TABS = [
  { id: 'anasayfa',       label: '⚡ Ana Sayfa' },
  { id: 'kimlik',         label: 'Kimlik' },
  { id: 'tarama',         label: 'Tarama' },
  { id: 'aliskanliklar',  label: 'Alışkanlıklar' },
  { id: 'program',        label: 'Program' },
  { id: 'degerlendirme',  label: 'Değerlendirme' },
  { id: 'ilerleme',       label: 'İlerleme' },
]

// Başlık h1'inin ikinci satırı için highlighter vurgusu
// (kitap kapağında önemli sözcüklerin üzerine kalemle işaretleme jesti)
function Highlight({ children }) {
  return (
    <span
      style={{
        display: 'inline',
        background: 'var(--color-accent-soft)',
        paddingInline: '6px',
        paddingBottom: '3px',
        borderRadius: '4px',
        color: 'var(--color-accent-ink)',
      }}
    >
      {children}
    </span>
  )
}

// --- Header ---
function AppHeader({ activeTab, onTabChange }) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        background: 'color-mix(in srgb, var(--color-canvas) 94%, transparent)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--color-border)',
        zIndex: 10,
      }}
    >
      <div
        style={{
          maxWidth: '1020px',
          margin: '0 auto',
          padding: '0 20px',
        }}
      >
        {/* Üst satır: logo + tarih */}
        <div
          style={{
            height: '52px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Logo />

          <time
            dateTime={new Date().toISOString().split('T')[0]}
            style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}
          >
            {todayTurkish()}
          </time>
        </div>

        {/* Sekme navigasyonu — .tab-nav CSS sınıfı mobilde sararak iki satır yapar */}
        <nav aria-label="Bölümler" className="tab-nav">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(tab.id)}
                className={`tab-btn${isActive ? ' tab-btn--active' : ''}`}
              >
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>
    </header>
  )
}

// --- Sayfa başlıkları (bölüme özel) ---
const PAGE_TITLES = {
  kimlik: {
    line1: 'Kim olmak',
    line2: 'istiyorsun?',
    sub: "%1'lik gelişim, büyük sıçramalardan değil — kim olduğunu bilmekten başlar.",
  },
  tarama: {
    line1: 'Önce gör,',
    line2: 'sonra değiştir.',
    sub: 'Günlük davranışlarını listele ve yargılamadan incele. Farkındalık, değişimin ilk adımıdır.',
  },
  aliskanliklar: {
    line1: 'Zinciri',
    line2: 'kırma.',
    sub: 'Her tamamlanan alışkanlık, kim olduğunun birer kanıtıdır. Küçük başla, tutarlı devam et.',
  },
  program: {
    line1: 'Zamanı',
    line2: 'yönet.',
    sub: 'Zaman bloğu olmayan hedef ertelenen hedeftir. Günün programını oluştur ve takip et.',
  },
  degerlendirme: {
    line1: 'Günü',
    line2: 'kapat.',
    sub: 'İki dakika. Bugün ne oldu, yarın ne olacak. Tutarlı refleksiyon, sessiz bileşik faiz gibi çalışır.',
  },
  ilerleme: {
    line1: 'Birikimi',
    line2: 'gör.',
    sub: 'Her gün %1 daha iyi. Birikim grafiklere yansır — ama önce günlere yansımalı.',
  },
}

// --- Ana uygulama ---
export default function App() {
  const [activeTab, setActiveTab] = useState('anasayfa')
  const pageTitle = PAGE_TITLES[activeTab]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-canvas)' }}>
      <AppHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <main
        style={{
          maxWidth: '1020px',
          margin: '0 auto',
          padding: '40px 20px 80px',
        }}
      >
        {/* key={activeTab}: sekme değişince bileşeni yeniden mount et → fadeSlideIn tetiklenir */}
        <div key={activeTab} className="page-section">

          {/* Sayfa başlığı — Ana Sayfa'da gösterilmez */}
          {pageTitle && (
            <section aria-label="Bölüm başlığı" style={{ marginBottom: '32px' }}>
              <h1
                className="font-display"
                style={{
                  fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                  fontWeight: 700,
                  lineHeight: 1.2,
                  letterSpacing: '-0.025em',
                  color: 'var(--color-ink)',
                  marginBottom: '8px',
                }}
              >
                {pageTitle.line1}
                <br />
                <Highlight>{pageTitle.line2}</Highlight>
              </h1>
              <p
                style={{
                  fontSize: '0.9375rem',
                  color: 'var(--color-muted)',
                  lineHeight: 1.65,
                  maxWidth: '420px',
                  marginTop: '10px',
                }}
              >
                {pageTitle.sub}
              </p>
            </section>
          )}

          {/* İçerik */}
          {activeTab === 'anasayfa'      && <Dashboard onNavigate={setActiveTab} />}
          {activeTab === 'kimlik'        && <IdentityCard />}
          {activeTab === 'tarama'        && <HabitScorecard />}
          {activeTab === 'aliskanliklar' && <HabitTracker />}
          {activeTab === 'program'       && <DailySchedule />}
          {activeTab === 'degerlendirme' && <EveningReview />}
          {activeTab === 'ilerleme'      && <ProgressView />}

        </div>
      </main>
    </div>
  )
}
