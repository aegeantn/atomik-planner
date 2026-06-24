// Dashboard.jsx — Ana Sayfa: Tier/karakter, streak, alışkanlık checklist,
// bugünün programı, sabah odağı ve bölüm navigasyon kartları.

import { useState, useEffect } from 'react'
import Character from './Character'
import {
  getHabits,
  getGoals,
  getMorningFocus,
  getTier,
  toggleHabitLog,
} from '../api'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

// Kart sarmalayıcı
function Card({ children, style = {} }) {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: '20px',
        padding: '22px',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// Bölüm etiketi
function SectionLabel({ children }) {
  return (
    <p
      style={{
        fontSize: '0.6875rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--color-accent-ink)',
        marginBottom: '12px',
      }}
    >
      {children}
    </p>
  )
}

// Son 7 günü birleştirilmiş alışkanlık loglarından hesaplar
function buildWeekDots(habits) {
  const today = todayStr()
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

  const completionMap = {}
  for (const day of days) {
    const anyDone = habits.some((h) =>
      h.recent_logs?.some((l) => l.date === day && l.completed)
    )
    completionMap[day] = anyDone
  }
  return { days, completionMap, today }
}

// Gün adı kısaltmaları (Pazartesi → Pzt)
const DAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

// ─── Karakter + Tier bölümü ───────────────────────────────────
function CharacterSection({ tierData }) {
  if (!tierData) {
    return (
      <Card style={{ textAlign: 'center', padding: '32px 22px' }}>
        <div style={{ opacity: 0.4, fontSize: '0.875rem', color: 'var(--color-muted)' }}>
          Yükleniyor…
        </div>
      </Card>
    )
  }

  const { tier, name, completedDays, nextTierDays, progress } = tierData

  return (
    <Card
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        padding: '24px 28px',
        background: `linear-gradient(135deg, var(--color-surface) 60%, color-mix(in srgb, var(--color-accent-soft) 40%, var(--color-surface)))`,
        flexWrap: 'wrap',
      }}
    >
      {/* Karakter */}
      <div style={{ display: 'flex', justifyContent: 'center', minWidth: '120px' }}>
        <Character tier={tier} />
      </div>

      {/* Tier bilgisi */}
      <div style={{ flex: 1, minWidth: '160px' }}>
        {/* Seviye rozeti */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-accent-ink)',
              background: 'var(--color-accent-soft)',
              padding: '3px 10px',
              borderRadius: '20px',
            }}
          >
            Seviye {tier}
          </span>
        </div>

        {/* Karakter adı */}
        <h2
          className="font-display"
          style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            color: 'var(--color-ink)',
            lineHeight: 1.1,
            marginBottom: '12px',
          }}
        >
          {name}
        </h2>

        {/* Progress bar */}
        {tier < 5 && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px',
              }}
            >
              <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                {completedDays} / {nextTierDays} gün
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-accent-ink)', fontWeight: 600 }}>
                %{Math.round(progress * 100)}
              </span>
            </div>
            <div
              style={{
                height: '8px',
                background: 'var(--color-border)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.round(progress * 100)}%`,
                  background: 'linear-gradient(90deg, var(--color-accent), var(--dot-orange))',
                  borderRadius: '4px',
                  transition: 'width 600ms ease',
                }}
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '6px' }}>
              Sonraki seviye için {nextTierDays - completedDays} gün daha
            </p>
          </div>
        )}
        {tier === 5 && (
          <p style={{ fontSize: '0.875rem', color: 'var(--color-accent-ink)', fontWeight: 600 }}>
            ✨ Maksimum seviyeye ulaştın!
          </p>
        )}
      </div>
    </Card>
  )
}

// ─── Streak & Gün Noktaları ───────────────────────────────────
function StreakCard({ habits }) {
  const bestStreak = habits.length > 0
    ? Math.max(...habits.map((h) => h.streak || 0))
    : 0
  const todayDone = habits.filter((h) => h.today_completed).length

  const { days, completionMap, today } = buildWeekDots(habits)

  return (
    <Card>
      <SectionLabel>Streak & Bu Hafta</SectionLabel>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', marginBottom: '16px' }}>
        <span
          className="font-display"
          style={{
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: 700,
            lineHeight: 1,
            color: 'var(--color-accent)',
          }}
        >
          {bestStreak}
        </span>
        <span style={{ fontSize: '1.5rem', paddingBottom: '4px' }}>⚡</span>
        <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)', paddingBottom: '8px' }}>
          streak
        </span>
      </div>

      {/* Gün noktaları */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end' }}>
        {days.map((day, i) => {
          const isToday = day === today
          const done = completionMap[day]
          const dayObj = new Date(day)
          const jsDay = dayObj.getDay() // 0=Pazar
          const label = DAY_LABELS[jsDay === 0 ? 6 : jsDay - 1]

          return (
            <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: done ? 'var(--color-accent)' : 'transparent',
                  border: isToday
                    ? '2.5px solid var(--color-accent-ink)'
                    : `2px solid ${done ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 200ms ease',
                }}
              >
                {done && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke={isToday ? 'var(--color-ink)' : '#15130E'} strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
              </div>
              <span style={{ fontSize: '0.625rem', color: isToday ? 'var(--color-accent-ink)' : 'var(--color-muted)', fontWeight: isToday ? 700 : 400 }}>
                {label}
              </span>
            </div>
          )
        })}
      </div>

      {habits.length > 0 && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginTop: '14px' }}>
          Bugün{' '}
          <strong style={{ color: 'var(--color-success)' }}>{todayDone}</strong>
          {' / '}{habits.length} alışkanlık tamamlandı
        </p>
      )}
    </Card>
  )
}

// ─── Bugünün Alışkanlıkları (Checklist) ──────────────────────
function HabitChecklist({ habits, onToggle, onNavigate }) {
  const visible = habits.slice(0, 5)
  const rest = habits.length - 5

  return (
    <Card>
      <SectionLabel>Bugünün Alışkanlıkları</SectionLabel>

      {habits.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginBottom: '12px' }}>
            Henüz alışkanlık yok.
          </p>
          <button
            onClick={() => onNavigate('aliskanliklar')}
            style={{
              padding: '8px 16px',
              background: 'var(--color-accent)',
              color: 'var(--color-ink)',
              border: 'none',
              borderRadius: '10px',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 600,
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
          >
            Alışkanlık ekle
          </button>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {visible.map((habit) => {
            const done = !!habit.today_completed
            return (
              <li
                key={habit.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                {/* Checkbox */}
                <button
                  onClick={() => onToggle(habit.id)}
                  aria-label={done ? 'Tamamlandı, geri al' : 'Tamamla'}
                  style={{
                    flexShrink: 0,
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    border: `2px solid ${done ? 'var(--color-success)' : 'var(--color-border)'}`,
                    background: done ? 'var(--color-success)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                    padding: 0,
                  }}
                >
                  {done && (
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M2 7l3.5 3.5L11 3" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
                    </svg>
                  )}
                </button>

                {/* Alışkanlık adı */}
                <span
                  style={{
                    flex: 1,
                    fontSize: '0.9375rem',
                    color: done ? 'var(--color-muted)' : 'var(--color-ink)',
                    textDecoration: done ? 'line-through' : 'none',
                    transition: 'all 200ms ease',
                  }}
                >
                  {habit.name}
                </span>

                {/* Streak rozeti */}
                {habit.streak >= 7 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                    🔥 {habit.streak}
                  </span>
                )}
              </li>
            )
          })}

          {rest > 0 && (
            <li>
              <button
                onClick={() => onNavigate('aliskanliklar')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-accent-ink)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 0',
                }}
              >
                … ve {rest} alışkanlık daha →
              </button>
            </li>
          )}
        </ul>
      )}
    </Card>
  )
}

// ─── Bugünün Programı ─────────────────────────────────────────
function ScheduleCard({ goals, onNavigate }) {
  const visible = goals.slice(0, 5)
  const rest = goals.length - 5
  const done = goals.filter((g) => g.done).length

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <SectionLabel>Bugünün Programı</SectionLabel>
        {goals.length > 0 && (
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: done === goals.length ? 'var(--color-success)' : 'var(--color-accent-ink)',
              background: done === goals.length
                ? 'color-mix(in srgb, var(--color-success) 12%, transparent)'
                : 'var(--color-accent-soft)',
              padding: '3px 10px',
              borderRadius: '20px',
            }}
          >
            {done}/{goals.length}
          </span>
        )}
      </div>

      {goals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginBottom: '12px' }}>
            Bugün için program oluşturulmamış.
          </p>
          <button
            onClick={() => onNavigate('program')}
            style={{
              padding: '8px 16px',
              background: 'var(--color-accent)',
              color: 'var(--color-ink)',
              border: 'none',
              borderRadius: '10px',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 600,
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
          >
            Programı oluştur
          </button>
        </div>
      ) : (
        <>
          {/* İlerleme çubuğu */}
          <div
            style={{
              height: '5px',
              background: 'var(--color-border)',
              borderRadius: '3px',
              overflow: 'hidden',
              marginBottom: '14px',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${goals.length > 0 ? Math.round((done / goals.length) * 100) : 0}%`,
                background: done === goals.length ? 'var(--color-success)' : 'var(--color-accent)',
                borderRadius: '3px',
                transition: 'width 400ms ease',
              }}
            />
          </div>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '9px' }}>
            {visible.map((goal) => (
              <li
                key={goal.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                {/* Tik */}
                <div
                  style={{
                    flexShrink: 0,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: goal.done ? 'var(--color-success)' : 'transparent',
                    border: `2px solid ${goal.done ? 'var(--color-success)' : 'var(--color-border)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {goal.done && (
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path d="M1.5 5l2 2L7.5 2" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  )}
                </div>

                {/* Saat */}
                {goal.start_time && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-muted)',
                      fontFamily: "'Courier New', monospace",
                      flexShrink: 0,
                    }}
                  >
                    {goal.start_time}
                  </span>
                )}

                {/* Başlık */}
                <span
                  style={{
                    flex: 1,
                    fontSize: '0.875rem',
                    color: goal.done ? 'var(--color-muted)' : 'var(--color-ink)',
                    textDecoration: goal.done ? 'line-through' : 'none',
                  }}
                >
                  {goal.title}
                </span>
              </li>
            ))}

            {rest > 0 && (
              <li>
                <button
                  onClick={() => onNavigate('program')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-accent-ink)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '2px 0',
                  }}
                >
                  … ve {rest} hedef daha →
                </button>
              </li>
            )}
          </ul>
        </>
      )}
    </Card>
  )
}

// ─── Sabah Odağı ──────────────────────────────────────────────
function MorningFocusCard({ focus }) {
  if (!focus) return null
  return (
    <Card
      style={{
        background: 'linear-gradient(135deg, var(--color-accent-soft), color-mix(in srgb, var(--color-accent-soft) 40%, var(--color-surface)))',
        border: '1.5px solid color-mix(in srgb, var(--color-accent) 30%, transparent)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span>☀️</span>
        <span
          style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-accent-ink)',
          }}
        >
          Sabah Odağın
        </span>
      </div>
      <p
        className="font-display"
        style={{
          fontSize: '1rem',
          fontWeight: 600,
          color: 'var(--color-ink)',
          lineHeight: 1.55,
        }}
      >
        "{focus}"
      </p>
    </Card>
  )
}

// ─── Bölüm Navigasyon Kartları ────────────────────────────────
const SECTIONS = [
  { id: 'kimlik',        emoji: '🪪', label: 'Kimlik',         desc: 'Kimlik beyanları' },
  { id: 'tarama',        emoji: '🔍', label: 'Tarama',         desc: 'Davranış farkındalığı' },
  { id: 'aliskanliklar', emoji: '✅', label: 'Alışkanlıklar',  desc: 'Streak & günlük log' },
  { id: 'program',       emoji: '📅', label: 'Program',        desc: 'Zaman blokları' },
  { id: 'degerlendirme', emoji: '🌙', label: 'Değerlendirme',  desc: 'Akşam refleksiyonu' },
  { id: 'ilerleme',      emoji: '📈', label: 'İlerleme',       desc: 'Haftalık & aylık grafik' },
]

function SectionNav({ onNavigate }) {
  const [hovered, setHovered] = useState(null)

  return (
    <div>
      <SectionLabel>Bölümler</SectionLabel>
      <div className="section-nav-grid">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => onNavigate(s.id)}
            onMouseEnter={() => setHovered(s.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '6px',
              padding: '16px',
              background: 'var(--color-surface)',
              border: hovered === s.id
                ? '1.5px solid var(--color-accent)'
                : '1.5px solid var(--color-border)',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'border-color 150ms ease, transform 150ms ease, box-shadow 150ms ease',
              transform: hovered === s.id ? 'translateY(-2px)' : 'translateY(0)',
              boxShadow: hovered === s.id
                ? '0 4px 16px color-mix(in srgb, var(--color-accent) 15%, transparent)'
                : 'none',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>{s.emoji}</span>
            <span
              className="font-display"
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-ink)',
                lineHeight: 1.2,
              }}
            >
              {s.label}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', lineHeight: 1.3 }}>
              {s.desc}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Ana Dashboard bileşeni ───────────────────────────────────
export default function Dashboard({ onNavigate }) {
  const [habits, setHabits]       = useState([])
  const [goals, setGoals]         = useState([])
  const [focus, setFocus]         = useState(null)
  const [tierData, setTierData]   = useState(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    const date = todayStr()
    Promise.all([
      getHabits(),
      getGoals(date),
      getMorningFocus().catch(() => null),
      getTier(),
    ]).then(([h, g, f, t]) => {
      setHabits(h || [])
      setGoals(g || [])
      setFocus(typeof f === 'string' ? f : f?.focus || null)
      setTierData(t)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function handleToggle(id) {
    // Optimistik güncelleme
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id
          ? { ...h, today_completed: h.today_completed ? 0 : 1 }
          : h
      )
    )
    try {
      await toggleHabitLog(id)
    } catch {
      // Hata durumunda geri al
      setHabits((prev) =>
        prev.map((h) =>
          h.id === id
            ? { ...h, today_completed: h.today_completed ? 0 : 1 }
            : h
        )
      )
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-muted)', fontSize: '0.9375rem' }}>
        Yükleniyor…
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Karakter & Tier — tam genişlik */}
      <CharacterSection tierData={tierData} />

      {/* İki sütun grid */}
      <div className="dashboard-grid">
        {/* Sol sütun */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <StreakCard habits={habits} />
          <HabitChecklist habits={habits} onToggle={handleToggle} onNavigate={onNavigate} />
        </div>

        {/* Sağ sütun */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <ScheduleCard goals={goals} onNavigate={onNavigate} />
          <MorningFocusCard focus={focus} />
        </div>
      </div>

      {/* Bölüm kartları — tam genişlik */}
      <Card>
        <SectionNav onNavigate={onNavigate} />
      </Card>
    </div>
  )
}
