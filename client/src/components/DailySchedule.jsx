// DailySchedule.jsx — Bugünün zaman-bloklu programı
//
// Akış:
// 1. Bugünün kayıtlı hedeflerini çek → varsa "Programa" göster
// 2. "Planla" → sunucudan önerilen blokları al → önizle
// 3. "Onayla" → kaydet → timeline'a geç
// 4. Her blok: tamamla butonu + sil

import { useState, useEffect, useCallback } from 'react'
import { getGoals, addGoal, proposeSchedule, confirmSchedule, toggleGoalDone, deleteGoal,
         getCalendarStatus, getCalendarAuthUrl, syncToCalendar, disconnectCalendar } from '../api'

// --- Tarih yardımcısı ---
function todayStr() {
  return new Date().toISOString().split('T')[0]
}
function todayTurkish() {
  return new Date().toLocaleDateString('tr-TR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

// --- SVG Progress Ring (imza öğe) ---
// Circular progress: ne kadar günün tamamlandığını tek bakışta gösterir.
function ProgressRing({ done, total }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  const SIZE = 52
  const STROKE = 4
  const r = (SIZE - STROKE) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)
  const isComplete = pct === 100
  const color = isComplete ? 'var(--color-success)' : 'var(--color-accent)'

  return (
    <div aria-label={`Bugün ${done} / ${total} tamamlandı`} style={{ flexShrink: 0 }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
        {/* Arka plan halkası */}
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={r}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={STROKE}
        />
        {/* İlerleme halkası */}
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={{ transition: 'stroke-dashoffset 600ms ease, stroke 300ms ease' }}
        />
        {/* Yüzde metni */}
        <text
          x={SIZE / 2}
          y={SIZE / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            fill: color,
            fontFamily: "'Inter', sans-serif",
            transition: 'fill 300ms ease',
          }}
        >
          {pct}%
        </text>
      </svg>
    </div>
  )
}

// --- Süre hesapla (start_time ve end_time'dan dakika) ---
function durationLabel(start, end) {
  if (!start || !end) return null
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const mins = (eh * 60 + em) - (sh * 60 + sm)
  if (mins <= 0) return null
  return `${mins} dk`
}

// --- Tek hedef satırı ---
function GoalRow({ goal, onToggle, onDelete, preview = false }) {
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const isDone = goal.done === 1

  async function handleToggle() {
    if (preview || toggling) return
    setToggling(true)
    await onToggle(goal.id, !isDone)
    setToggling(false)
  }

  async function handleDelete() {
    if (preview) return
    setDeleting(true)
    await onDelete(goal.id)
  }

  const duration = durationLabel(goal.start_time, goal.end_time)

  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: 0,
        opacity: deleting ? 0.4 : 1,
        transition: 'opacity 150ms ease',
      }}
    >
      {/* Zaman sütunu */}
      <div
        aria-label={`${goal.start_time || ''}${goal.end_time ? ' – ' + goal.end_time : ''}`}
        style={{
          width: '64px',
          flexShrink: 0,
          paddingTop: '14px',
          paddingRight: '12px',
          textAlign: 'right',
        }}
      >
        {goal.start_time && (
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: preview ? 'var(--color-accent)' : 'var(--color-muted)', fontVariantNumeric: 'tabular-nums' }}>
            {goal.start_time}
          </span>
        )}
      </div>

      {/* Sol çizgi + nokta */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px', flexShrink: 0 }}>
        <div style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: preview
            ? 'var(--color-accent)'
            : isDone ? 'var(--color-success, #059669)' : 'var(--color-border)',
          border: `2px solid ${preview ? 'var(--color-accent)' : isDone ? 'var(--color-success, #059669)' : 'var(--color-border)'}`,
          marginTop: '17px',
          flexShrink: 0,
          transition: 'background 200ms ease',
        }} />
        <div style={{ width: '2px', flex: 1, background: 'var(--color-border)', minHeight: '12px' }} />
      </div>

      {/* İçerik kartı */}
      <div
        style={{
          flex: 1,
          margin: '8px 0 8px 8px',
          background: preview ? 'var(--color-accent-soft)' : 'var(--color-surface)',
          border: `1.5px solid ${preview ? 'color-mix(in srgb, var(--color-accent) 25%, transparent)' : 'var(--color-border)'}`,
          borderRadius: '12px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        {/* Tamamlama dairesi */}
        {!preview && (
          <button
            onClick={handleToggle}
            disabled={toggling}
            aria-label={isDone ? 'Geri al' : 'Tamamla'}
            aria-pressed={isDone}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: isDone ? 'none' : '2px solid var(--color-border)',
              background: isDone ? 'var(--color-success, #059669)' : 'transparent',
              cursor: toggling ? 'wait' : 'pointer',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 150ms ease, border-color 150ms ease',
            }}
            onMouseEnter={(e) => {
              if (!isDone) e.currentTarget.style.borderColor = 'var(--color-success, #059669)'
            }}
            onMouseLeave={(e) => {
              if (!isDone) e.currentTarget.style.borderColor = 'var(--color-border)'
            }}
          >
            {isDone && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M1.5 6l3.5 3.5 5.5-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        )}

        {/* Başlık */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: '0.9375rem',
            fontWeight: 500,
            color: isDone ? 'var(--color-muted)' : 'var(--color-ink)',
            textDecoration: isDone ? 'line-through' : 'none',
            transition: 'color 200ms ease',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {goal.title}
          </p>
          {duration && (
            <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '1px' }}>
              {goal.end_time && `→ ${goal.end_time}`}{duration && ` · ${duration}`}
            </p>
          )}
        </div>

        {/* Sil butonu (önizlemede yok) */}
        {!preview && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            aria-label={`"${goal.title}" hedefini sil`}
            style={{
              flexShrink: 0,
              color: 'var(--color-muted)',
              padding: '3px',
              border: 'none',
              background: 'transparent',
              cursor: deleting ? 'wait' : 'pointer',
              lineHeight: 0,
              borderRadius: '5px',
              transition: 'color 150ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-muted)')}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
    </li>
  )
}

// --- Timeline bileşeni ---
function Timeline({ goals, onToggle, onDelete, preview = false }) {
  if (!goals.length) return null
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {goals.map((goal) => (
        <GoalRow
          key={goal.id ?? goal.title + goal.start_time}
          goal={goal}
          onToggle={onToggle}
          onDelete={onDelete}
          preview={preview}
        />
      ))}
    </ul>
  )
}

// --- İlerleme çubuğu ---
function ProgressBar({ goals }) {
  const total = goals.length
  const done = goals.filter((g) => g.done).length
  if (!total) return null
  const pct = Math.round((done / total) * 100)
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--color-muted)', marginBottom: '6px' }}>
        <span>{done} / {total} tamamlandı</span>
        <span style={{ fontWeight: 600, color: pct === 100 ? 'var(--color-success, #059669)' : 'var(--color-accent)' }}>{pct}%</span>
      </div>
      <div style={{ height: '4px', background: 'var(--color-border)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: pct === 100
            ? 'var(--color-success, #059669)'
            : 'linear-gradient(90deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 70%, #7C3AED))',
          borderRadius: '2px',
          transition: 'width 400ms ease',
        }} />
      </div>
    </div>
  )
}

// --- Manuel hedef ekleme formu ---
function AddGoalForm({ date, onAdd, onCancel }) {
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const goal = await addGoal({
        title: title.trim(),
        date,
        start_time: startTime || null,
        end_time: endTime || null,
      })
      onAdd(goal)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  const inputStyle = {
    border: '1.5px solid var(--color-border)',
    borderRadius: '10px',
    padding: '9px 12px',
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '0.9rem',
    color: 'var(--color-ink)',
    background: 'var(--color-surface)',
    outline: 'none',
    transition: 'border-color 200ms ease, box-shadow 200ms ease',
  }

  function onFocus(e) {
    e.target.style.borderColor = 'var(--color-accent)'
    e.target.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--color-accent) 12%, transparent)'
  }
  function onBlur(e) {
    e.target.style.borderColor = 'var(--color-border)'
    e.target.style.boxShadow = 'none'
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: 'var(--color-accent-soft)',
        border: '1.5px solid color-mix(in srgb, var(--color-accent) 25%, transparent)',
        borderRadius: '14px',
        padding: '16px',
        marginBottom: '16px',
      }}
    >
      {error && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-danger)', marginBottom: '10px' }}>{error}</p>
      )}

      {/* Başlık */}
      <input
        type="text"
        style={{ ...inputStyle, width: '100%', marginBottom: '10px' }}
        placeholder="Ne yapacaksın? (örn. Doktor randevusu)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        maxLength={200}
        autoFocus
        required
      />

      {/* Zaman seçiciler */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-muted)', marginBottom: '4px' }}>
            Başlangıç
          </label>
          <input
            type="time"
            style={{ ...inputStyle, width: '100%' }}
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-muted)', marginBottom: '4px' }}>
            Bitiş
          </label>
          <input
            type="time"
            style={{ ...inputStyle, width: '100%' }}
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          style={{
            flex: 1,
            padding: '9px',
            background: submitting || !title.trim() ? 'var(--color-border)' : 'var(--color-accent)',
            color: submitting || !title.trim() ? 'var(--color-muted)' : '#fff',
            border: 'none',
            borderRadius: '10px',
            fontFamily: "'Inter', system-ui, sans-serif",
            fontWeight: 500,
            fontSize: '0.9rem',
            cursor: submitting || !title.trim() ? 'not-allowed' : 'pointer',
            transition: 'background 150ms ease',
          }}
        >
          {submitting ? 'Ekleniyor…' : 'Ekle'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '9px 14px',
            background: 'transparent',
            color: 'var(--color-muted)',
            border: '1.5px solid var(--color-border)',
            borderRadius: '10px',
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          İptal
        </button>
      </div>
    </form>
  )
}

// --- Google Calendar paneli ---
// connected: bağlı mı | disconnected: değil | unconfigured: .env eksik | syncing | synced
function CalendarPanel({ goals, date }) {
  const [status, setStatus] = useState('checking')
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  useEffect(() => {
    getCalendarStatus()
      .then((r) => {
        if (!r.hasCredentials) setStatus('unconfigured')
        else setStatus(r.connected ? 'connected' : 'disconnected')
      })
      .catch(() => setStatus('disconnected'))
  }, [])

  // URL'de ?calendar=connected parametresi varsa durumu güncelle
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const result = params.get('calendar')
    if (result === 'connected') {
      setStatus('connected')
      window.history.replaceState({}, '', window.location.pathname)
    } else if (result === 'error') {
      setStatus('disconnected')
      setSyncMsg('Google bağlantısı başarısız oldu. Tekrar dene.')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  async function handleConnect() {
    try {
      const { url } = await getCalendarAuthUrl()
      window.location.href = url
    } catch (err) {
      setSyncMsg(err.message)
    }
  }

  async function handleSync() {
    setSyncing(true)
    setSyncMsg('')
    try {
      const result = await syncToCalendar(date)
      setSyncMsg(
        result.synced === 0
          ? result.message || 'Gönderilecek zaman bloğu yok.'
          : `✓ ${result.synced}/${result.total} etkinlik takvime eklendi.`
      )
    } catch (err) {
      setSyncMsg(err.message)
    } finally {
      setSyncing(false)
    }
  }

  async function handleDisconnect() {
    await disconnectCalendar()
    setStatus('disconnected')
    setSyncMsg('')
  }

  if (status === 'checking') return null

  return (
    <div
      style={{
        marginTop: '20px',
        borderTop: '1px solid var(--color-border)',
        paddingTop: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Google Calendar simgesi (SVG) */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="var(--color-muted)" strokeWidth="1.5" />
          <path d="M3 9h18" stroke="var(--color-muted)" strokeWidth="1.5" />
          <path d="M8 3v3M16 3v3" stroke="var(--color-muted)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
          {status === 'unconfigured' && 'Google Calendar yapılandırılmamış'}
          {status === 'disconnected' && 'Google Calendar bağlı değil'}
          {status === 'connected' && 'Google Calendar bağlı'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {syncMsg && (
          <span style={{ fontSize: '0.8125rem', color: syncMsg.startsWith('✓') ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {syncMsg}
          </span>
        )}

        {status === 'unconfigured' && (
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
            .env dosyasındaki GOOGLE_CLIENT_SECRET değerini güncelle
          </span>
        )}

        {status === 'disconnected' && (
          <button
            onClick={handleConnect}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              color: 'var(--color-accent)',
              border: '1.5px solid var(--color-accent)',
              borderRadius: '8px',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Bağlan
          </button>
        )}

        {status === 'connected' && (
          <>
            <button
              onClick={handleSync}
              disabled={syncing || goals.length === 0}
              style={{
                padding: '6px 12px',
                background: syncing || goals.length === 0 ? 'var(--color-border)' : 'var(--color-accent)',
                color: syncing || goals.length === 0 ? 'var(--color-muted)' : '#fff',
                border: 'none',
                borderRadius: '8px',
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: '0.8125rem',
                fontWeight: 500,
                cursor: syncing || goals.length === 0 ? 'not-allowed' : 'pointer',
                transition: 'background 150ms ease',
              }}
            >
              {syncing ? 'Gönderiliyor…' : 'Takvime Gönder'}
            </button>
            <button
              onClick={handleDisconnect}
              style={{
                padding: '6px 10px',
                background: 'transparent',
                color: 'var(--color-muted)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
              }}
            >
              Bağlantıyı kes
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// --- Ana bileşen ---
export default function DailySchedule() {
  const date = todayStr()
  const [goals, setGoals] = useState([])
  const [proposed, setProposed] = useState(null)
  const [mode, setMode] = useState('loading') // loading | empty | scheduled | proposing | preview | confirming
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  const loadGoals = useCallback(async () => {
    try {
      const data = await getGoals(date)
      setGoals(data)
      setMode(data.length > 0 ? 'scheduled' : 'empty')
    } catch {
      setError('Hedefler yüklenemedi.')
      setMode('empty')
    }
  }, [date])

  useEffect(() => { loadGoals() }, [loadGoals])

  async function handlePropose() {
    setMode('proposing')
    setError('')
    try {
      const result = await proposeSchedule(date)
      if (!result.blocks?.length) {
        setError(result.message || 'Program oluşturulamadı. Önce alışkanlıklarına zaman ayarla.')
        setMode(goals.length > 0 ? 'scheduled' : 'empty')
        return
      }
      setProposed(result.blocks)
      setMode('preview')
    } catch (err) {
      setError(err.message)
      setMode(goals.length > 0 ? 'scheduled' : 'empty')
    }
  }

  async function handleConfirm() {
    setMode('confirming')
    setError('')
    try {
      const result = await confirmSchedule(date, proposed)
      setGoals(result.goals)
      setProposed(null)
      setMode('scheduled')
    } catch (err) {
      setError(err.message)
      setMode('preview')
    }
  }

  async function handleToggle(id, done) {
    setError('')
    try {
      const updated = await toggleGoalDone(id, done)
      setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, done: updated.done } : g)))
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id) {
    setError('')
    try {
      await deleteGoal(id)
      const remaining = goals.filter((g) => g.id !== id)
      setGoals(remaining)
      if (!remaining.length) setMode('empty')
    } catch (err) {
      setError(err.message)
    }
  }

  function handleAddManual(newGoal) {
    // Yeni hedefi listeye ekle; start_time'a göre sıralı yerleştir
    setGoals((prev) => {
      const updated = [...prev, newGoal].sort((a, b) => {
        if (!a.start_time && !b.start_time) return 0
        if (!a.start_time) return 1
        if (!b.start_time) return -1
        return a.start_time.localeCompare(b.start_time)
      })
      return updated
    })
    setMode('scheduled')
    setShowAddForm(false)
  }

  const isLoading = mode === 'loading' || mode === 'proposing' || mode === 'confirming'

  return (
    <section
      aria-labelledby="schedule-heading"
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border)',
        borderRadius: '20px',
        padding: '28px',
      }}
    >
      {/* Başlık */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <h2
            id="schedule-heading"
            className="font-display text-2xl font-semibold"
            style={{ color: 'var(--color-ink)' }}
          >
            Bugünün Programı
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginTop: '3px' }}>
            {todayTurkish()}
          </p>
        </div>

        {/* Progress ring — program varsa göster */}
        {mode === 'scheduled' && goals.length > 0 && (
          <ProgressRing
            done={goals.filter((g) => g.done).length}
            total={goals.length}
          />
        )}

        {/* Aksiyon butonları */}
        {!isLoading && mode !== 'preview' && (
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            {/* Manuel hedef ekle */}
            <button
              onClick={() => setShowAddForm((v) => !v)}
              aria-label="Manuel hedef ekle"
              title="Kendin ekle"
              style={{
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: showAddForm ? 'var(--color-accent-soft)' : 'transparent',
                color: showAddForm ? 'var(--color-accent)' : 'var(--color-muted)',
                border: `1.5px solid ${showAddForm ? 'color-mix(in srgb, var(--color-accent) 30%, transparent)' : 'var(--color-border)'}`,
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            {/* Alışkanlıklardan otomatik plan */}
            <button
              onClick={handlePropose}
              style={{
                padding: '8px 14px',
                background: 'var(--color-accent)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontFamily: "'Inter', system-ui, sans-serif",
                fontWeight: 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'opacity 150ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              {mode === 'scheduled' ? 'Yeniden Planla' : 'Günümü Planla'}
            </button>
          </div>
        )}
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
            marginBottom: '16px',
          }}
        >
          {error}
        </div>
      )}

      {/* Manuel hedef ekleme formu */}
      {showAddForm && !isLoading && mode !== 'preview' && (
        <AddGoalForm
          date={date}
          onAdd={handleAddManual}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Yükleniyor */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-muted)', fontSize: '0.9rem' }}>
          {mode === 'proposing' ? 'Program oluşturuluyor…' : mode === 'confirming' ? 'Kaydediliyor…' : 'Yükleniyor…'}
        </div>
      )}

      {/* Boş durum */}
      {mode === 'empty' && (
        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
          <p className="font-display italic text-lg" style={{ color: 'var(--color-ink)' }}>
            Bugün için program yok.
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginTop: '6px', maxWidth: '340px', margin: '6px auto 0' }}>
            "Günümü Planla" ile alışkanlıklarını zaman bloklarına otomatik dönüştür.
          </p>
        </div>
      )}

      {/* Önizleme modu */}
      {mode === 'preview' && proposed && (
        <>
          <div
            style={{
              background: 'var(--color-accent-soft)',
              border: '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)',
              borderRadius: '10px',
              padding: '10px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <p style={{ fontSize: '0.875rem', color: 'var(--color-accent)', fontWeight: 500 }}>
              📋 {proposed.length} blok önerildi — onaylamak için onayla.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleConfirm}
                style={{
                  padding: '7px 14px',
                  background: 'var(--color-accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Onayla ve Kaydet
              </button>
              <button
                onClick={() => { setProposed(null); setMode(goals.length > 0 ? 'scheduled' : 'empty') }}
                style={{
                  padding: '7px 12px',
                  background: 'transparent',
                  color: 'var(--color-muted)',
                  border: '1.5px solid var(--color-border)',
                  borderRadius: '8px',
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                İptal
              </button>
            </div>
          </div>
          <Timeline goals={proposed} onToggle={() => {}} onDelete={() => {}} preview />
        </>
      )}

      {/* Program (kayıtlı hedefler) */}
      {mode === 'scheduled' && goals.length > 0 && (
        <>
          <ProgressBar goals={goals} />
          <Timeline goals={goals} onToggle={handleToggle} onDelete={handleDelete} />
        </>
      )}

      {/* Google Calendar paneli — her zaman göster (bağlı değilse bağlan butonu) */}
      {!isLoading && mode !== 'preview' && (
        <CalendarPanel goals={goals} date={date} />
      )}
    </section>
  )
}
