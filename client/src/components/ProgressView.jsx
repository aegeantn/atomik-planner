// ProgressView.jsx — Haftalık / aylık ilerleme görünümü
// Saf CSS + inline SVG; harici chart kütüphanesi yok.

import { useState, useEffect } from 'react'
import { getStats } from '../api'

// --- Tarih yardımcıları ---
function todayStr() { return new Date().toISOString().split('T')[0] }
function offsetDate(dateStr, d) {
  const dt = new Date(dateStr)
  dt.setDate(dt.getDate() + d)
  return dt.toISOString().split('T')[0]
}
// 'YYYY-MM-DD' → 'Pzt', 'Sal' vb.
const TR_DAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
function shortDay(dateStr) {
  return TR_DAYS[new Date(dateStr).getDay()]
}
// 'YYYY-MM-DD' → '24 Haz'
function shortDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

// --- Özet kart ---
function StatCard({ value, label, accent = false }) {
  return (
    <div
      style={{
        background: accent ? 'var(--color-accent-soft)' : 'var(--color-surface)',
        border: `1.5px solid ${accent ? 'color-mix(in srgb, var(--color-accent) 25%, transparent)' : 'var(--color-border)'}`,
        borderRadius: '14px',
        padding: '16px 18px',
        flex: 1,
        minWidth: '100px',
      }}
    >
      <p
        style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          color: accent ? 'var(--color-accent)' : 'var(--color-ink)',
          lineHeight: 1,
          marginBottom: '4px',
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 500 }}>{label}</p>
    </div>
  )
}

// --- Günlük bar chart ---
// CSS div-tabanlı, tam responsive.
function BarChart({ daily }) {
  if (!daily.length) return null
  const maxRate = Math.max(...daily.map((d) => d.rate), 0.001)
  const MAX_H = 72 // px

  return (
    <div
      style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: `${MAX_H + 24}px` }}
      role="img"
      aria-label="Günlük tamamlama grafiği"
    >
      {daily.map((d) => {
        const barH = Math.max(d.rate > 0 ? (d.rate / maxRate) * MAX_H : 3, d.rate > 0 ? 6 : 2)
        const isComplete = d.rate >= 0.999
        const barColor = isComplete
          ? 'var(--color-success)'
          : d.rate > 0
          ? 'var(--color-accent)'
          : 'var(--color-border)'

        return (
          <div
            key={d.date}
            title={`${shortDate(d.date)}: ${Math.round(d.rate * 100)}% (${d.completed} tamamlandı)`}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}
          >
            <div
              style={{
                width: '100%',
                height: `${barH}px`,
                background: barColor,
                borderRadius: '3px 3px 0 0',
                transition: 'height 500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                position: 'relative',
                outline: d.isToday ? '2px solid var(--color-accent)' : 'none',
                outlineOffset: '1px',
              }}
            />
            <span style={{ fontSize: '0.5625rem', color: d.isToday ? 'var(--color-accent)' : 'var(--color-muted)', fontWeight: d.isToday ? 700 : 400, whiteSpace: 'nowrap' }}>
              {daily.length <= 14 ? shortDay(d.date) : (d.date.slice(-2))}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// --- Completion rate çubuğu ---
function RateBar({ rate }) {
  const pct = Math.round(rate * 100)
  const color = pct === 100 ? 'var(--color-success)' : pct >= 60 ? 'var(--color-accent)' : 'var(--color-muted)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: '5px', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: '3px',
          transition: 'width 600ms ease',
        }} />
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color, minWidth: '30px', textAlign: 'right' }}>
        %{pct}
      </span>
    </div>
  )
}

// --- Habit dot grid (period'daki her gün bir nokta) ---
function DotGrid({ habit, period, dateList }) {
  const today = todayStr()
  return (
    <div
      style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}
      aria-label={`${habit.name} — son ${period} gün`}
    >
      {dateList.map((date) => {
        const completed = habit.logs[date]
        const isFuture = date > today
        const isToday = date === today
        let bg, border
        if (isFuture) { bg = 'transparent'; border = '1.5px solid var(--color-border)' }
        else if (completed) { bg = 'var(--color-success)'; border = 'none' }
        else { bg = 'var(--color-border)'; border = 'none' }
        return (
          <span
            key={date}
            title={`${shortDate(date)}: ${completed ? 'tamamlandı' : 'tamamlanmadı'}`}
            style={{
              width: '11px',
              height: '11px',
              borderRadius: '3px',
              background: bg,
              border: isToday ? '2px solid var(--color-accent)' : border,
              boxSizing: 'border-box',
              flexShrink: 0,
            }}
          />
        )
      })}
    </div>
  )
}

// --- Streak rozeti (ProgressView versiyonu) ---
function StreakBadge({ streak }) {
  if (!streak) return null
  return (
    <span
      aria-label={`${streak} günlük seri`}
      style={{
        fontSize: '0.75rem',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: '20px',
        background: streak >= 7 ? 'linear-gradient(135deg,#F59E0B,#EF4444)' : 'linear-gradient(135deg,#FDE68A,#FCA5A5)',
        color: streak >= 7 ? '#fff' : '#92400E',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      🔥 {streak}
    </span>
  )
}

// --- Ana bileşen ---
export default function ProgressView() {
  const [period, setPeriod] = useState(7)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    getStats(period)
      .then((d) => { setData(d); setLoading(false) })
      .catch((err) => { setError(err.message); setLoading(false) })
  }, [period])

  // Period'daki tarih listesi (dot grid için)
  const today = todayStr()
  const dateList = data?.daily.map((d) => d.date) ?? []

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-muted)' }}>Yükleniyor…</div>
  }
  if (error) {
    return <div style={{ color: 'var(--color-danger)', padding: '16px' }}>{error}</div>
  }
  if (!data) return null

  const { overview, daily, habits } = data
  const avgRate = daily.length
    ? Math.round(daily.reduce((s, d) => s + d.rate, 0) / daily.length * 100)
    : 0

  return (
    <section aria-labelledby="progress-heading" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Başlık + dönem seçici */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <h2
          id="progress-heading"
          className="font-display text-2xl font-semibold"
          style={{ color: 'var(--color-ink)' }}
        >
          İlerleme
        </h2>
        <div
          role="group"
          aria-label="Dönem seç"
          style={{ display: 'flex', gap: '4px', background: 'var(--color-border)', borderRadius: '10px', padding: '3px' }}
        >
          {[7, 30].map((d) => (
            <button
              key={d}
              onClick={() => setPeriod(d)}
              aria-pressed={period === d}
              style={{
                padding: '5px 14px',
                borderRadius: '8px',
                border: 'none',
                background: period === d ? 'var(--color-surface)' : 'transparent',
                color: period === d ? 'var(--color-ink)' : 'var(--color-muted)',
                fontFamily: "'Inter', system-ui, sans-serif",
                fontWeight: period === d ? 600 : 400,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'background 150ms ease, color 150ms ease',
                boxShadow: period === d ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {d} Gün
            </button>
          ))}
        </div>
      </div>

      {/* Özet sayılar */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <StatCard value={overview.activeHabits} label="Aktif alışkanlık" />
        <StatCard value={overview.completedToday} label="Bugün tamamlanan" accent />
        <StatCard value={`%${avgRate}`} label={`${period} gün ort.`} />
        <StatCard value={overview.daysTracked} label="Takip edilen gün" />
      </div>

      {/* Bar chart */}
      {daily.length > 0 ? (
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            borderRadius: '16px',
            padding: '20px 20px 16px',
          }}
        >
          <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Günlük tamamlama oranı
          </p>
          <BarChart daily={daily} />
        </div>
      ) : (
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center',
          }}
        >
          <p className="font-display italic" style={{ color: 'var(--color-muted)' }}>
            Henüz log kaydı yok.
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginTop: '4px' }}>
            Alışkanlıklarını tamamlamaya başlayınca grafik burada belirecek.
          </p>
        </div>
      )}

      {/* Alışkanlık bazlı detay */}
      {habits.length > 0 && (
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            borderRadius: '16px',
            overflow: 'hidden',
          }}
        >
          <p style={{
            fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-muted)',
            textTransform: 'uppercase', letterSpacing: '0.04em',
            padding: '16px 20px 12px',
            borderBottom: '1px solid var(--color-border)',
          }}>
            Alışkanlık detayı
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {habits.map((habit, i) => (
              <li
                key={habit.id}
                style={{
                  padding: '16px 20px',
                  borderBottom: i < habits.length - 1 ? '1px solid var(--color-border)' : 'none',
                }}
              >
                {/* İsim + streak */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span
                    className="font-display"
                    style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-ink)', flex: 1 }}
                  >
                    {habit.name}
                  </span>
                  <StreakBadge streak={habit.streak} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
                    {habit.completedDays}/{habit.totalDays} gün
                  </span>
                </div>

                {/* Rate bar */}
                <RateBar rate={habit.rate} />

                {/* Dot grid */}
                <div style={{ marginTop: '10px' }}>
                  <DotGrid habit={habit} period={period} dateList={dateList} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {habits.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-muted)', fontSize: '0.9rem' }}>
          Aktif alışkanlık yok. Alışkanlıklar sekmesinden ekleyebilirsin.
        </div>
      )}
    </section>
  )
}
