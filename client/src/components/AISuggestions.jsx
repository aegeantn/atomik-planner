// AISuggestions.jsx — Atomic Habits tabanlı yapay zekâ önerisi paneli
//
// Kullanım:
//   <AISuggestions section="kimlik" onAdd={async (payload) => { await addIdentity(payload.statement); refresh() }} />
//
// section: 'kimlik' | 'tarama' | 'aliskanliklar' | 'program'
// onAdd:   öneri eklenince çağrılır; payload, ilgili API'ye gönderilecek veri

import { useState, useEffect } from 'react'
import { getAIStatus, getAISuggestions } from '../api'

// Modül seviyesi önbellek — bileşen yeniden mount olsa bile öneriler kaybolmaz
const cache = {}
const addedCache = {}

// Yıldız ikonu
function IconSparkle() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 2l1.5 4.5L16 8l-4.5 1.5L10 14l-1.5-4.5L4 8l4.5-1.5L10 2z"
        fill="currentColor"
      />
    </svg>
  )
}

// Artı ikonu
function IconPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export default function AISuggestions({ section, onAdd }) {
  const [aiEnabled, setAiEnabled]       = useState(false)
  const [status, setStatus]             = useState(() => cache[section]?.length > 0 ? 'done' : 'idle')
  const [suggestions, setSuggestions]   = useState(() => cache[section] || [])
  const [errorMsg, setErrorMsg]         = useState('')
  const [addingIdx, setAddingIdx]       = useState(null)
  const [addedIdxs, setAddedIdxs]       = useState(() => addedCache[section] || new Set())

  // API anahtarı var mı kontrol et
  useEffect(() => {
    getAIStatus()
      .then(({ enabled }) => setAiEnabled(enabled))
      .catch(() => setAiEnabled(false))
  }, [])

  if (!aiEnabled) return null

  async function handleGetSuggestions() {
    setStatus('loading')
    setSuggestions([])
    setErrorMsg('')
    const freshAdded = new Set()
    setAddedIdxs(freshAdded)
    addedCache[section] = freshAdded

    try {
      const { suggestions: list } = await getAISuggestions(section)
      const result = list || []
      setSuggestions(result)
      cache[section] = result
      setStatus('done')
    } catch (err) {
      setErrorMsg(err.message || 'Öneri alınamadı.')
      setStatus('error')
    }
  }

  async function handleAdd(idx) {
    if (!onAdd) return
    setAddingIdx(idx)
    try {
      await onAdd(suggestions[idx].payload)
      setAddedIdxs((prev) => {
        const next = new Set([...prev, idx])
        addedCache[section] = next
        return next
      })
    } catch (err) {
      console.error('Ekleme hatası:', err)
    } finally {
      setAddingIdx(null)
    }
  }

  return (
    <div className="ai-panel">
      {/* Başlık satırı */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{ color: 'var(--color-accent-ink)', display: 'flex' }}>
            <IconSparkle />
          </span>
          <span
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--color-accent-ink)',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            Yapay Zekâ Önerisi
          </span>
        </div>

        <button
          onClick={handleGetSuggestions}
          disabled={status === 'loading'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            background: status === 'loading' ? 'var(--color-border)' : 'var(--color-accent)',
            color: status === 'loading' ? 'var(--color-muted)' : 'var(--color-ink)',
            border: 'none',
            borderRadius: '8px',
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: status === 'loading' ? 'not-allowed' : 'pointer',
            transition: 'background 150ms ease, opacity 150ms ease',
            opacity: status === 'loading' ? 0.7 : 1,
          }}
        >
          {status === 'loading' ? (
            <>
              <span
                style={{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  border: '2px solid var(--color-muted)',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                }}
              />
              Düşünüyor…
            </>
          ) : suggestions.length > 0 ? (
            'Yenile'
          ) : (
            'Öneri al'
          )}
        </button>
      </div>

      {/* Hata */}
      {status === 'error' && (
        <p
          style={{
            marginTop: '12px',
            fontSize: '0.875rem',
            color: 'var(--color-danger)',
            background: '#FEE2E2',
            padding: '10px 14px',
            borderRadius: '8px',
          }}
        >
          {errorMsg}
        </p>
      )}

      {/* Öneri kartları */}
      {status === 'done' && suggestions.length > 0 && (
        <div
          style={{
            marginTop: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {suggestions.map((s, idx) => {
            const added = addedIdxs.has(idx)
            const adding = addingIdx === idx

            return (
              <div key={idx} className="ai-suggestion-card">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        fontSize: '0.9375rem',
                        color: 'var(--color-ink)',
                        marginBottom: '4px',
                      }}
                    >
                      {s.title}
                    </p>
                    <p
                      style={{
                        fontSize: '0.8125rem',
                        color: 'var(--color-muted)',
                        lineHeight: 1.55,
                      }}
                    >
                      {s.detail}
                    </p>
                  </div>

                  <button
                    onClick={() => !added && handleAdd(idx)}
                    disabled={added || adding}
                    title={added ? 'Eklendi' : 'Ekle'}
                    style={{
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 12px',
                      background: added
                        ? 'color-mix(in srgb, var(--color-success) 12%, transparent)'
                        : 'var(--color-accent-soft)',
                      color: added ? 'var(--color-success)' : 'var(--color-accent-ink)',
                      border: `1.5px solid ${added ? 'color-mix(in srgb, var(--color-success) 30%, transparent)' : 'color-mix(in srgb, var(--color-accent) 30%, transparent)'}`,
                      borderRadius: '8px',
                      fontFamily: "'Inter', system-ui, sans-serif",
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      cursor: added ? 'default' : 'pointer',
                      transition: 'all 150ms ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {adding ? (
                      '…'
                    ) : added ? (
                      '✓ Eklendi'
                    ) : (
                      <>
                        <IconPlus /> Ekle
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Boş durum */}
      {status === 'done' && suggestions.length === 0 && (
        <p
          style={{
            marginTop: '12px',
            fontSize: '0.875rem',
            color: 'var(--color-muted)',
          }}
        >
          Bu bölüm için öneri üretilemedi. Tekrar dene.
        </p>
      )}

      {/* Döndürme animasyonu (yükleme çarkı için) */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
