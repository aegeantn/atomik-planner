// HabitScorecard.jsx — Mevcut davranış farkındalığı (Atomic Habits 1. adım)
//
// Kullanım: Yeni alışkanlık kurmadan önce günlük davranışları listele,
// sonra her birini "iyi / nötr / kötü" olarak işaretle.
// Amaç değiştirmek değil — görmek.

import { useState, useEffect, useRef } from 'react'
import {
  getScorecard,
  addScorecardItem,
  updateScorecardRating,
  deleteScorecardItem,
} from '../api'
import AISuggestions from './AISuggestions'

// --- Sabit: puanlama seçenekleri ---
const RATINGS = [
  {
    value: 'iyi',
    label: 'İyi',
    // aktif: yeşil dolu, pasif: yeşil şeffaf
    activeStyle: { background: '#059669', color: '#fff', borderColor: '#059669' },
    ghostStyle: { background: 'transparent', color: '#059669', borderColor: '#A7F3D0' },
  },
  {
    value: 'nötr',
    label: 'Nötr',
    activeStyle: { background: '#B45309', color: '#fff', borderColor: '#B45309' },
    ghostStyle: { background: 'transparent', color: '#B45309', borderColor: '#FDE68A' },
  },
  {
    value: 'kötü',
    label: 'Kötü',
    activeStyle: { background: '#DC2626', color: '#fff', borderColor: '#DC2626' },
    ghostStyle: { background: 'transparent', color: '#DC2626', borderColor: '#FCA5A5' },
  },
]

// Puanlama için sol kenar rengi (identity-item'daki gradient yerine düz renk)
const RATING_ACCENT = {
  iyi: '#059669',
  nötr: '#B45309',
  kötü: '#DC2626',
}

// --- İkon ---
function IconX() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

// --- Tek davranış satırı ---
function ScorecardRow({ item, onRatingChange, onDelete }) {
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleRating(newRating) {
    if (newRating === item.rating || updating) return
    setUpdating(true)
    await onRatingChange(item.id, newRating)
    setUpdating(false)
  }

  async function handleDelete() {
    setDeleting(true)
    await onDelete(item.id)
    // state temizlenmez — bileşen unmount olur
  }

  const accentColor = RATING_ACCENT[item.rating] || '#B45309'

  return (
    <li
      style={{
        position: 'relative',
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderLeft: 'none',
        borderRadius: '12px',
        padding: '12px 14px 12px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        opacity: deleting ? 0.5 : 1,
        transition: 'opacity 150ms ease',
      }}
    >
      {/* Sol renk çizgisi — rating'e göre değişir */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          top: '8px',
          bottom: '8px',
          width: '3px',
          borderRadius: '0 2px 2px 0',
          background: accentColor,
          transition: 'background 200ms ease',
        }}
      />

      {/* Davranış metni */}
      <p
        style={{
          flex: 1,
          fontSize: '0.9375rem',
          color: 'var(--color-ink)',
          lineHeight: 1.4,
        }}
      >
        {item.behavior}
      </p>

      {/* Puanlama butonları */}
      <div
        role="group"
        aria-label={`"${item.behavior}" için puanlama`}
        style={{ display: 'flex', gap: '4px', flexShrink: 0 }}
      >
        {RATINGS.map((r) => {
          const isActive = item.rating === r.value
          const style = isActive ? r.activeStyle : r.ghostStyle
          return (
            <button
              key={r.value}
              onClick={() => handleRating(r.value)}
              disabled={updating || deleting}
              aria-pressed={isActive}
              aria-label={r.label}
              style={{
                padding: '3px 9px',
                fontSize: '0.75rem',
                fontWeight: 500,
                border: `1.5px solid ${style.borderColor}`,
                borderRadius: '20px',
                cursor: updating || deleting ? 'wait' : 'pointer',
                transition: 'all 150ms ease',
                fontFamily: "'Inter', system-ui, sans-serif",
                ...style,
              }}
            >
              {r.label}
            </button>
          )
        })}
      </div>

      {/* Silme butonu */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        aria-label={`"${item.behavior}" davranışını sil`}
        style={{
          flexShrink: 0,
          color: 'var(--color-muted)',
          padding: '4px',
          borderRadius: '6px',
          border: 'none',
          background: 'transparent',
          cursor: deleting ? 'wait' : 'pointer',
          lineHeight: 0,
          transition: 'color 150ms ease, background 150ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--color-danger)'
          e.currentTarget.style.background =
            'color-mix(in srgb, var(--color-danger) 8%, transparent)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--color-muted)'
          e.currentTarget.style.background = 'transparent'
        }}
      >
        {deleting ? <span style={{ fontSize: '0.75rem' }}>…</span> : <IconX />}
      </button>
    </li>
  )
}

// --- Ana bileşen ---
export default function HabitScorecard() {
  const [items, setItems] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    try {
      const data = await getScorecard()
      setItems(data)
    } catch {
      setError('Davranışlar yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(e) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return

    setAdding(true)
    setError('')

    try {
      const newItem = await addScorecardItem(trimmed)
      setItems((prev) => [newItem, ...prev])
      setInput('')
      inputRef.current?.focus()
    } catch (err) {
      setError(err.message)
    } finally {
      setAdding(false)
    }
  }

  async function handleRatingChange(id, rating) {
    setError('')
    try {
      const updated = await updateScorecardRating(id, rating)
      // İmmutable güncelleme: sadece değişen öğeyi yenile
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)))
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id) {
    setError('')
    try {
      await deleteScorecardItem(id)
      setItems((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  // Özet: kaç iyi, nötr, kötü var?
  const summary = items.reduce(
    (acc, item) => ({ ...acc, [item.rating]: (acc[item.rating] || 0) + 1 }),
    {}
  )

  return (
    <section
      aria-labelledby="scorecard-heading"
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: '20px',
        padding: '28px',
      }}
    >
      {/* Başlık */}
      <header style={{ marginBottom: '20px' }}>
        <h2
          id="scorecard-heading"
          className="font-display text-2xl font-semibold"
          style={{ color: 'var(--color-ink)' }}
        >
          Alışkanlık Tarama
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted)', maxWidth: '460px', lineHeight: 1.6 }}>
          Günlük davranışlarını yargılamadan listele. Sonra her birini işaretle.
          Değiştirmek için henüz erken — önce gör.
        </p>
      </header>

      {/* Özet rozetleri (veriler varsa göster) */}
      {items.length > 0 && (
        <div
          style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}
          aria-label="Puanlama özeti"
        >
          {[
            { key: 'iyi', label: 'İyi', color: '#059669', bg: '#D1FAE5' },
            { key: 'nötr', label: 'Nötr', color: '#B45309', bg: '#FEF3C7' },
            { key: 'kötü', label: 'Kötü', color: '#DC2626', bg: '#FEE2E2' },
          ].map(({ key, label, color, bg }) =>
            summary[key] ? (
              <span
                key={key}
                style={{
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  background: bg,
                  color,
                }}
              >
                {summary[key]} {label}
              </span>
            ) : null
          )}
        </div>
      )}

      {/* Hata */}
      {error && (
        <div
          role="alert"
          className="text-sm mb-4 px-4 py-3 rounded-xl"
          style={{
            background: 'color-mix(in srgb, var(--color-danger) 8%, transparent)',
            color: 'var(--color-danger)',
            border: '1px solid color-mix(in srgb, var(--color-danger) 20%, transparent)',
          }}
        >
          {error}
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="py-8 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
          Yükleniyor…
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 px-4">
          <p className="font-display italic text-lg" style={{ color: 'var(--color-ink)' }}>
            Henüz davranış eklenmedi.
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            Örnek: <em>"Kahve ile telefona bakıyorum"</em> veya <em>"Her sabah yürüyorum"</em>
          </p>
        </div>
      ) : (
        <ul
          className="flex flex-col gap-2 mb-6"
          aria-label="Davranış listesi"
        >
          {items.map((item) => (
            <ScorecardRow
              key={item.id}
              item={item}
              onRatingChange={handleRatingChange}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      )}

      {/* Yeni davranış ekleme */}
      <form
        onSubmit={handleAdd}
        style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '12px' }}
      >
        <label htmlFor="new-behavior" className="sr-only">
          Yeni davranış
        </label>
        <input
          id="new-behavior"
          ref={inputRef}
          type="text"
          className="input-primary"
          placeholder="Günlük bir davranış yaz… (örn. Her sabah kahve içiyorum)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={300}
          disabled={adding}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={adding || !input.trim()}
          style={{
            flexShrink: 0,
            padding: '12px 20px',
            background:
              adding || !input.trim() ? 'var(--color-border)' : 'var(--color-accent)',
            color: adding || !input.trim() ? 'var(--color-muted)' : '#fff',
            border: 'none',
            borderRadius: '12px',
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: '0.9375rem',
            fontWeight: 500,
            cursor: adding || !input.trim() ? 'not-allowed' : 'pointer',
            transition: 'background 150ms ease, color 150ms ease',
            whiteSpace: 'nowrap',
          }}
        >
          {adding ? 'Ekleniyor' : 'Ekle'}
        </button>
      </form>

      {input.length > 0 && (
        <p
          className="text-xs mt-2 text-right"
          style={{
            color: input.length > 280 ? 'var(--color-danger)' : 'var(--color-muted)',
          }}
        >
          {input.length} / 300
        </p>
      )}

      {/* Yapay zekâ önerileri */}
      <AISuggestions
        section="tarama"
        onAdd={async (payload) => {
          const newItem = await addScorecardItem(payload.behavior)
          setItems((prev) => [newItem, ...prev])
        }}
      />
    </section>
  )
}
