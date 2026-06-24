// App.jsx — Uygulama kabuğu: header + sekme navigasyonu + içerik

import { useState } from 'react'
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
  { id: 'kimlik', label: 'Kimlik' },
  { id: 'tarama', label: 'Tarama' },
  { id: 'aliskanliklar', label: 'Alışkanlıklar' },
  { id: 'program', label: 'Program' },
  { id: 'degerlendirme', label: 'Değerlendirme' },
  { id: 'ilerleme', label: 'İlerleme' },
]

// --- Header ---
function AppHeader({ activeTab, onTabChange }) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        background: 'color-mix(in srgb, var(--color-canvas) 92%, transparent)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--color-border)',
        zIndex: 10,
      }}
    >
      <div
        style={{
          maxWidth: '680px',
          margin: '0 auto',
          padding: '0 24px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              aria-hidden="true"
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--color-accent)',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontWeight: 600,
                fontSize: '0.9375rem',
                letterSpacing: '-0.01em',
                color: 'var(--color-ink)',
              }}
            >
              Atomik Planner
            </span>
          </div>

          <time
            dateTime={new Date().toISOString().split('T')[0]}
            style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}
          >
            {todayTurkish()}
          </time>
        </div>

        {/* Sekme navigasyonu — dar ekranlarda yatay kaydırılabilir */}
        <nav
          aria-label="Bölümler"
          style={{
            display: 'flex',
            gap: '2px',
            overflowX: 'auto',
            scrollbarWidth: 'none',      /* Firefox */
            msOverflowStyle: 'none',     /* IE/Edge */
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(tab.id)}
                style={{
                  flexShrink: 0,
                  padding: '8px 12px',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 400,
                  fontFamily: "'Inter', system-ui, sans-serif",
                  color: isActive ? 'var(--color-accent)' : 'var(--color-muted)',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive
                    ? '2px solid var(--color-accent)'
                    : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'color 150ms ease, border-color 150ms ease',
                  marginBottom: '-1px',
                  whiteSpace: 'nowrap',
                }}
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

// --- Ana uygulama ---
export default function App() {
  const [activeTab, setActiveTab] = useState('kimlik')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-canvas)' }}>
      <AppHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <main
        style={{
          maxWidth: '680px',
          margin: '0 auto',
          padding: '40px 24px 80px',
        }}
      >
        {/* key={activeTab}: sekme değişince bileşeni yeniden mount et → fadeSlideIn tetiklenir */}
        <div key={activeTab} className="page-section">

        {/* Sayfa başlığı — aktif sekmeye göre */}
        <section aria-label="Bölüm başlığı" style={{ marginBottom: '32px' }}>
          <h1
            className="font-display"
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: 600,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              color: 'var(--color-ink)',
              marginBottom: '8px',
            }}
          >
            {activeTab === 'kimlik' && (
              <>Kim olmak<br /><em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>istiyorsun?</em></>
            )}
            {activeTab === 'tarama' && (
              <>Önce gör,<br /><em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>sonra değiştir.</em></>
            )}
            {activeTab === 'aliskanliklar' && (
              <>Zinciri<br /><em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>kırma.</em></>
            )}
            {activeTab === 'program' && (
              <>Zamanı<br /><em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>yönet.</em></>
            )}
            {activeTab === 'degerlendirme' && (
              <>Günü<br /><em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>kapat.</em></>
            )}
            {activeTab === 'ilerleme' && (
              <>Birikimi<br /><em style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>gör.</em></>
            )}
          </h1>
          <p
            style={{
              fontSize: '0.9375rem',
              color: 'var(--color-muted)',
              lineHeight: 1.65,
              maxWidth: '420px',
            }}
          >
            {activeTab === 'kimlik'
              ? "%1'lik gelişim, büyük sıçramalardan değil — kim olduğunu bilmekten başlar."
              : activeTab === 'tarama'
              ? "Günlük davranışlarını listele ve yargılamadan incele. Farkındalık, değişimin ilk adımıdır."
              : activeTab === 'aliskanliklar'
              ? "Her tamamlanan alışkanlık, kim olduğunun birer kanıtıdır. Küçük başla, tutarlı devam et."
              : activeTab === 'program'
              ? "Zaman bloğu olmayan hedef ertelenen hedeftir. Günün programını oluştur ve takip et."
              : activeTab === 'degerlendirme'
              ? "İki dakika. Bugün ne oldu, yarın ne olacak. Tutarlı refleksiyon, sessiz bileşik faiz gibi çalışır."
              : "Her gün %1 daha iyi. Birikim grafiklere yansır — ama önce günlere yansımalı."}
          </p>
        </section>

        {/* İçerik */}
        {activeTab === 'kimlik' && <IdentityCard />}
        {activeTab === 'tarama' && <HabitScorecard />}
        {activeTab === 'aliskanliklar' && <HabitTracker />}
        {activeTab === 'program' && <DailySchedule />}
        {activeTab === 'degerlendirme' && <EveningReview />}
        {activeTab === 'ilerleme' && <ProgressView />}

        </div> {/* .page-section */}
      </main>
    </div>
  )
}
