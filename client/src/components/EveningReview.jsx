// EveningReview.jsx — Gün sonu 2 dakika değerlendirme + sabah odağı
//
// Kitabın "reflection and review" prensibinden:
// Ne iyi gitti → ödüllendirme / Ne düzelteceğim → adaptasyon / Yarının odağı → niyet.
// Dünün "yarının odağı" bugün sabah odağı olarak döner — döngüyü kapatır.

import { useState, useEffect, useCallback } from 'react'
import { getReview, getMorningFocus, saveReview } from '../api'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}
function todayTurkish() {
  return new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// --- Otomatik yükseklik ayarlı textarea ---
function AutoTextarea({ id, label, placeholder, value, onChange, disabled }) {
  return (
    <div>
      <label
        htmlFor={id}
        style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}
      >
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={3}
        style={{
          width: '100%',
          border: '1.5px solid var(--color-border)',
          borderRadius: '12px',
          padding: '12px 14px',
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: '0.9375rem',
          color: 'var(--color-ink)',
          background: 'var(--color-surface)',
          resize: 'vertical',
          minHeight: '88px',
          lineHeight: 1.65,
          outline: 'none',
          transition: 'border-color 200ms ease, box-shadow 200ms ease',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--color-accent)'
          e.target.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--color-accent) 12%, transparent)'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--color-border)'
          e.target.style.boxShadow = 'none'
        }}
      />
    </div>
  )
}

export default function EveningReview() {
  const date = todayStr()

  // Form state
  const [whatWentWell, setWhatWentWell] = useState('')
  const [whatToImprove, setWhatToImprove] = useState('')
  const [tomorrowFocus, setTomorrowFocus] = useState('')

  // UI state
  const [morningFocus, setMorningFocus] = useState(null) // dünün tomorrow_focus
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null) // son kaydedilme zamanı
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    try {
      const [review, focus] = await Promise.all([getReview(date), getMorningFocus()])

      if (review) {
        setWhatWentWell(review.what_went_well || '')
        setWhatToImprove(review.what_to_improve || '')
        setTomorrowFocus(review.tomorrow_focus || '')
        setSavedAt(review.created_at)
      }
      setMorningFocus(focus?.tomorrow_focus || null)
    } catch {
      setError('Veriler yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => { loadData() }, [loadData])

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const result = await saveReview({
        date,
        what_went_well: whatWentWell,
        what_to_improve: whatToImprove,
        tomorrow_focus: tomorrowFocus,
      })
      setSavedAt(result.created_at)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // En az bir alan doldurulmuşsa kayıt aktif
  const hasContent = whatWentWell.trim() || whatToImprove.trim() || tomorrowFocus.trim()

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-muted)', fontSize: '0.9rem' }}>
        Yükleniyor…
      </div>
    )
  }

  return (
    <section aria-labelledby="review-heading" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Sabah odağı kartı — dünün niyeti, bugünün rehberi */}
      {morningFocus && (
        <div
          role="note"
          aria-label="Bugünün sabah odağı"
          style={{
            background: 'var(--color-accent-soft)',
            border: '1.5px solid color-mix(in srgb, var(--color-accent) 25%, transparent)',
            borderRadius: '16px',
            padding: '16px 20px',
          }}
        >
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-accent-ink)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            ☀️ Sabah odağın
          </p>
          <p
            className="font-display"
            style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--color-ink)', lineHeight: 1.5 }}
          >
            "{morningFocus}"
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '6px' }}>
            Dünün senden bugüne mesajı.
          </p>
        </div>
      )}

      {/* Değerlendirme formu */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1.5px solid var(--color-border)',
          borderRadius: '20px',
          padding: '28px',
        }}
      >
        {/* Başlık */}
        <header style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <h2
              id="review-heading"
              className="font-display text-2xl font-semibold"
              style={{ color: 'var(--color-ink)' }}
            >
              Akşam Değerlendirmesi
            </h2>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                padding: '3px 10px',
                borderRadius: '20px',
                background: 'var(--color-border)',
                color: 'var(--color-muted)',
              }}
            >
              ~2 dakika
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginTop: '4px' }}>
            {todayTurkish()}
          </p>
        </header>

        {/* Hata */}
        {error && (
          <div
            role="alert"
            style={{
              fontSize: '0.875rem',
              color: 'var(--color-danger)',
              background: 'color-mix(in srgb, var(--color-danger) 8%, transparent)',
              border: '1px solid color-mix(in srgb, var(--color-danger) 20%, transparent)',
              borderRadius: '10px',
              padding: '10px 14px',
              marginBottom: '20px',
            }}
          >
            {error}
          </div>
        )}

        {/* Üç soru */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <AutoTextarea
            id="what-went-well"
            label="✓ Bugün ne iyi gitti?"
            placeholder="Küçük bir şey bile olsa… Bir karar, bir alışkanlık, bir an."
            value={whatWentWell}
            onChange={setWhatWentWell}
            disabled={saving}
          />

          <AutoTextarea
            id="what-to-improve"
            label="↻ Yarın ne farklı yapardım?"
            placeholder="Bir şeyi değiştirmek ne fark yaratırdı? Kendini yargılama — sadece gözlemle."
            value={whatToImprove}
            onChange={setWhatToImprove}
            disabled={saving}
          />

          <AutoTextarea
            id="tomorrow-focus"
            label="→ Yarının tek odak noktası"
            placeholder="Yarın sabah uyandığında aklında ne olsun?"
            value={tomorrowFocus}
            onChange={setTomorrowFocus}
            disabled={saving}
          />
        </div>

        {/* Kaydet butonu + son kayıt zamanı */}
        <div
          style={{
            marginTop: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          {savedAt ? (
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
              ✓ Kaydedildi
            </p>
          ) : (
            <span />
          )}

          <button
            onClick={handleSave}
            disabled={saving || !hasContent}
            style={{
              padding: '11px 24px',
              background: saving || !hasContent ? 'var(--color-border)' : 'var(--color-accent)',
              color: saving || !hasContent ? 'var(--color-muted)' : '#fff',
              border: 'none',
              borderRadius: '12px',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 500,
              fontSize: '0.9375rem',
              cursor: saving || !hasContent ? 'not-allowed' : 'pointer',
              transition: 'background 150ms ease, color 150ms ease',
            }}
          >
            {saving ? 'Kaydediliyor…' : 'Günü Kapat'}
          </button>
        </div>
      </div>

      {/* Alt bilgi — kitaptan niyet */}
      <p
        style={{
          fontSize: '0.8125rem',
          color: 'var(--color-muted)',
          textAlign: 'center',
          lineHeight: 1.6,
          padding: '0 12px',
        }}
      >
        "Yıllık değerlendirme yapmayan kişi, nereye gittiğini bilmeden yürüyen kişidir." — James Clear
      </p>
    </section>
  )
}
