// IdentityCard.jsx — Kimlik beyanları yönetimi
// "Kim olduğunu belirlemek, doğru alışkanlıkların temelidir." — Atomic Habits

import { useState, useEffect, useRef } from 'react'
import { getIdentities, addIdentity, deleteIdentity } from '../api'

// --- İkonlar (inline SVG — dış bağımlılık yok) ---

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconX() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function IconSparkle() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 2l1.5 4.5L16 8l-4.5 1.5L10 14l-1.5-4.5L4 8l4.5-1.5L10 2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// --- Boş durum bileşeni ---

function EmptyState() {
  return (
    <div className="text-center py-10 px-4">
      <div
        className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
        style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}
      >
        <IconSparkle />
      </div>
      <p className="font-display italic text-lg" style={{ color: 'var(--color-ink)' }}>
        Henüz bir kimlik beyanın yok.
      </p>
      <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
        Örnek: <em>"Ben her gün öğrenen biriyim."</em>
      </p>
    </div>
  )
}

// --- Ana bileşen ---

export default function IdentityCard() {
  const [identities, setIdentities] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  // Sayfa açılınca mevcut kimlikleri çek
  useEffect(() => {
    fetchIdentities()
  }, [])

  async function fetchIdentities() {
    try {
      const data = await getIdentities()
      setIdentities(data)
    } catch {
      setError('Kimlikler yüklenemedi. Sunucunun çalıştığından emin ol.')
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
      const newIdentity = await addIdentity(trimmed)
      // İmmutable güncelleme: orijinal diziye dokunma, yeni dizi döndür
      setIdentities((prev) => [newIdentity, ...prev])
      setInput('')
      inputRef.current?.focus()
    } catch (err) {
      setError(err.message)
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id) {
    setDeletingId(id)
    setError('')

    try {
      await deleteIdentity(id)
      setIdentities((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section
      aria-labelledby="identity-heading"
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: '20px',
        padding: '28px',
      }}
    >
      {/* Başlık */}
      <header className="mb-6">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h2
            id="identity-heading"
            className="font-display text-2xl font-semibold"
            style={{ color: 'var(--color-ink)' }}
          >
            Kimlik Beyanlarım
          </h2>
          {/* Beyan sayısı rozeti — yüklendikten ve en az 1 varsa göster */}
          {!loading && identities.length > 0 && (
            <span
              aria-label={`${identities.length} kimlik beyanı`}
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '2px 9px',
                borderRadius: '20px',
                background: 'var(--color-accent-soft)',
                color: 'var(--color-accent)',
                letterSpacing: '0.01em',
              }}
            >
              {identities.length}
            </span>
          )}
        </div>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
          Her iyi alışkanlık, kim olduğunun birer kanıtıdır.
        </p>
      </header>

      {/* Hata mesajı */}
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

      {/* Kimlik listesi */}
      {loading ? (
        <div className="py-8 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
          Yükleniyor…
        </div>
      ) : identities.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="flex flex-col gap-3 mb-6" aria-label="Kimlik beyanları listesi">
          {identities.map((item) => (
            <li key={item.id} className="identity-item">
              {/* Beyan metni — imza: Fraunces italic */}
              <p
                className="font-display italic flex-1 leading-snug"
                style={{ fontSize: '1.0625rem', color: 'var(--color-ink)' }}
              >
                {item.statement}
              </p>

              {/* Silme butonu */}
              <button
                onClick={() => handleDelete(item.id)}
                disabled={deletingId === item.id}
                aria-label={`"${item.statement}" beyanını sil`}
                style={{
                  flexShrink: 0,
                  color: 'var(--color-muted)',
                  padding: '4px',
                  borderRadius: '6px',
                  transition: 'color 150ms ease, background 150ms ease',
                  background: 'transparent',
                  border: 'none',
                  cursor: deletingId === item.id ? 'wait' : 'pointer',
                  lineHeight: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-danger)'
                  e.currentTarget.style.background = 'color-mix(in srgb, var(--color-danger) 8%, transparent)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-muted)'
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                {deletingId === item.id ? (
                  <span style={{ fontSize: '0.75rem' }}>…</span>
                ) : (
                  <IconX />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Yeni beyan ekleme formu */}
      <form onSubmit={handleAdd} className="flex gap-3 items-center mt-4">
        <label htmlFor="new-identity" className="sr-only">
          Yeni kimlik beyanı
        </label>
        <input
          id="new-identity"
          ref={inputRef}
          type="text"
          className="input-primary"
          placeholder="Ben… (örn. Ben her gün öğrenen biriyim)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={300}
          disabled={adding}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={adding || !input.trim()}
          aria-label="Kimlik beyanı ekle"
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '12px 20px',
            background: adding || !input.trim()
              ? 'var(--color-border)'
              : 'var(--color-accent)',
            color: adding || !input.trim()
              ? 'var(--color-muted)'
              : '#FFFFFF',
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
          <IconPlus />
          {adding ? 'Ekleniyor' : 'Ekle'}
        </button>
      </form>

      {/* Karakter sayacı */}
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
    </section>
  )
}
