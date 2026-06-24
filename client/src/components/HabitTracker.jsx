// HabitTracker.jsx — Alışkanlık yönetimi, günlük log ve streak ("zinciri kırma")

import { useState, useEffect } from 'react'
import { getHabits, addHabit, deleteHabit, toggleHabitLog, getIdentities } from '../api'
import AISuggestions from './AISuggestions'

// --- Tarih yardımcıları (client-side, server ile aynı mantık) ---
function todayStr() {
  return new Date().toISOString().split('T')[0]
}
function offsetDate(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}
// Son N günün tarih listesini üret (bugün dahil, DESC sıralı değil ASC)
function lastNDays(n) {
  const today = todayStr()
  return Array.from({ length: n }, (_, i) => offsetDate(today, -(n - 1 - i)))
}

// --- Mini takvim bileşeni (son 14 gün) ---
function MiniCalendar({ recentLogs }) {
  const today = todayStr()
  const days = lastNDays(14)
  const logMap = {}
  for (const log of recentLogs) logMap[log.date] = log.completed

  return (
    <div
      style={{ display: 'flex', gap: '3px', marginTop: '8px' }}
      aria-label="Son 14 günlük tamamlanma takvimi"
    >
      {days.map((day) => {
        const isToday = day === today
        const completed = logMap[day]
        const isFuture = day > today

        let bg, border
        if (isFuture) {
          bg = 'transparent'
          border = '1.5px solid var(--color-border)'
        } else if (completed) {
          bg = 'var(--color-success, #059669)'
          border = 'none'
        } else {
          bg = 'var(--color-border)'
          border = 'none'
        }

        return (
          <span
            key={day}
            title={day}
            aria-label={`${day}: ${completed ? 'tamamlandı' : 'tamamlanmadı'}`}
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '3px',
              background: bg,
              border: isToday ? '2px solid var(--color-accent)' : border,
              flexShrink: 0,
              boxSizing: 'border-box',
            }}
          />
        )
      })}
    </div>
  )
}

// --- Streak rozeti ---
function StreakBadge({ streak }) {
  if (streak === 0) return null
  return (
    <span
      aria-label={`${streak} günlük seri`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        padding: '2px 8px',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: 600,
        background: streak >= 7
          ? 'linear-gradient(135deg, #F59E0B, #EF4444)'
          : 'linear-gradient(135deg, #FDE68A, #FCA5A5)',
        color: streak >= 7 ? '#fff' : '#92400E',
        flexShrink: 0,
      }}
    >
      🔥 {streak}
    </span>
  )
}

// --- Tek alışkanlık kartı ---
function HabitItem({ habit, onToggle, onDelete }) {
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  // checkPop animasyonunu tetiklemek için — tamamlandığında CSS class'ı kısa süreli uygula
  const [popping, setPopping] = useState(false)

  async function handleToggle() {
    if (toggling) return
    setToggling(true)
    await onToggle(habit.id)
    // Sadece tamamlanırken (0→1) pop animasyonu
    if (habit.today_completed === 0) {
      setPopping(true)
      setTimeout(() => setPopping(false), 320)
    }
    setToggling(false)
  }

  async function handleDelete() {
    if (!window.confirm(`"${habit.name}" alışkanlığını silmek istediğine emin misin?`)) return
    setDeleting(true)
    await onDelete(habit.id)
  }

  const isDone = habit.today_completed === 1

  return (
    <li
      style={{
        // Tamamlanınca yeşil wash — "bu iş bitti" mesajı tek bakışta
        background: isDone
          ? 'color-mix(in srgb, var(--color-success) 6%, var(--color-surface))'
          : 'var(--color-surface)',
        border: `1.5px solid ${isDone
          ? 'color-mix(in srgb, var(--color-success) 28%, transparent)'
          : 'var(--color-border)'}`,
        borderRadius: '14px',
        padding: '14px 16px',
        opacity: deleting ? 0.5 : 1,
        transition: 'background 300ms ease, border-color 300ms ease, opacity 150ms ease',
      }}
    >
      {/* "Never miss twice" uyarısı */}
      {habit.never_miss_twice_alert && habit.streak > 0 && (
        <div
          role="alert"
          style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: '#B45309',
            background: '#FEF3C7',
            borderRadius: '6px',
            padding: '4px 8px',
            marginBottom: '10px',
            display: 'inline-block',
          }}
        >
          ⚠️ Dün de kaçırdın — bugün kır ve zinciri koru!
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* Tamamlama butonu — büyük, dokunması kolay */}
        <button
          onClick={handleToggle}
          disabled={toggling || deleting}
          aria-label={isDone ? 'Tamamlandı — geri al' : 'Tamamla'}
          aria-pressed={isDone}
          className={popping ? 'check-pop' : ''}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            border: isDone ? 'none' : '2px solid var(--color-border)',
            background: isDone ? 'var(--color-success)' : 'transparent',
            cursor: toggling ? 'wait' : 'pointer',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 200ms ease, border-color 200ms ease',
            marginTop: '1px',
          }}
          onMouseEnter={(e) => {
            if (!isDone) e.currentTarget.style.borderColor = 'var(--color-success)'
          }}
          onMouseLeave={(e) => {
            if (!isDone) e.currentTarget.style.borderColor = 'var(--color-border)'
          }}
        >
          {isDone && (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 7l4 4 6-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* İçerik */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              className="font-display"
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: isDone ? 'var(--color-muted)' : 'var(--color-ink)',
                textDecoration: isDone ? 'line-through' : 'none',
                transition: 'color 200ms ease',
              }}
            >
              {habit.name}
            </span>
            <StreakBadge streak={habit.streak} />
          </div>

          {/* İsteğe bağlı: cue ve two_minute_version özeti */}
          {(habit.cue || habit.two_minute_version) && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginTop: '2px' }}>
              {habit.cue && <span>İpucu: {habit.cue}</span>}
              {habit.cue && habit.two_minute_version && <span> · </span>}
              {habit.two_minute_version && <span>2 dk: {habit.two_minute_version}</span>}
            </p>
          )}

          <MiniCalendar recentLogs={habit.recent_logs} />
        </div>

        {/* Silme butonu */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          aria-label={`"${habit.name}" alışkanlığını sil`}
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
            e.currentTarget.style.background = 'color-mix(in srgb, var(--color-danger) 8%, transparent)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-muted)'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </li>
  )
}

// --- Alışkanlık ekleme formu (Dört Yasa alanları) ---
function AddHabitForm({ identities, onAdd, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    identity_id: '',
    cue: '',
    craving: '',
    two_minute_version: '',
    stack_on: '',
    preferred_time: '',
    duration_min: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return

    setSubmitting(true)
    setError('')

    try {
      const payload = {
        name: form.name.trim(),
        identity_id: form.identity_id ? Number(form.identity_id) : null,
        cue: form.cue.trim() || null,
        craving: form.craving.trim() || null,
        two_minute_version: form.two_minute_version.trim() || null,
        stack_on: form.stack_on.trim() || null,
        preferred_time: form.preferred_time || null,
        duration_min: form.duration_min ? Number(form.duration_min) : 15,
      }
      await onAdd(payload)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  const inputStyle = {
    width: '100%',
    border: '1.5px solid var(--color-border)',
    borderRadius: '10px',
    padding: '10px 14px',
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '0.9rem',
    color: 'var(--color-ink)',
    background: 'var(--color-surface)',
    outline: 'none',
    transition: 'border-color 200ms ease, box-shadow 200ms ease',
  }
  const labelStyle = {
    display: 'block',
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: 'var(--color-muted)',
    marginBottom: '4px',
  }
  const fieldStyle = { display: 'flex', flexDirection: 'column', gap: '4px' }

  function focusInput(e) {
    e.target.style.borderColor = 'var(--color-accent)'
    e.target.style.boxShadow = 'color-mix(in srgb, var(--color-accent) 12%, transparent) 0 0 0 3px'
  }
  function blurInput(e) {
    e.target.style.borderColor = 'var(--color-border)'
    e.target.style.boxShadow = 'none'
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: 'var(--color-accent-soft)',
        border: '1.5px solid color-mix(in srgb, var(--color-accent) 25%, transparent)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '16px',
      }}
    >
      <h3
        className="font-display"
        style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--color-ink)', marginBottom: '16px' }}
      >
        Yeni Alışkanlık
      </h3>

      {error && (
        <div
          role="alert"
          style={{
            fontSize: '0.8125rem',
            color: 'var(--color-danger)',
            background: 'color-mix(in srgb, var(--color-danger) 8%, transparent)',
            border: '1px solid color-mix(in srgb, var(--color-danger) 20%, transparent)',
            borderRadius: '8px',
            padding: '8px 12px',
            marginBottom: '12px',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Alışkanlık adı */}
        <div style={fieldStyle}>
          <label htmlFor="habit-name" style={labelStyle}>Alışkanlık adı *</label>
          <input
            id="habit-name"
            type="text"
            style={inputStyle}
            placeholder="örn. 10 sayfa oku"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            onFocus={focusInput}
            onBlur={blurInput}
            maxLength={200}
            autoFocus
            required
          />
        </div>

        {/* Kimlik bağlantısı */}
        {identities.length > 0 && (
          <div style={fieldStyle}>
            <label htmlFor="habit-identity" style={labelStyle}>Hangi kimliği destekliyor? (isteğe bağlı)</label>
            <select
              id="habit-identity"
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={form.identity_id}
              onChange={(e) => set('identity_id', e.target.value)}
              onFocus={focusInput}
              onBlur={blurInput}
            >
              <option value="">Seçilmedi</option>
              {identities.map((id) => (
                <option key={id.id} value={id.id}>{id.statement}</option>
              ))}
            </select>
          </div>
        )}

        {/* Dört Yasa bölümü */}
        <div
          style={{
            borderTop: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)',
            paddingTop: '12px',
          }}
        >
          <p
            style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-accent)', marginBottom: '10px' }}
          >
            Dört Yasa (isteğe bağlı)
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* 1. Belirgin yap — Cue */}
            <div style={fieldStyle}>
              <label htmlFor="habit-cue" style={labelStyle}>
                📍 İpucu — ne zaman / nerede yapacaksın?
              </label>
              <input
                id="habit-cue"
                type="text"
                style={inputStyle}
                placeholder="örn. Sabah kahvemi bitirince"
                value={form.cue}
                onChange={(e) => set('cue', e.target.value)}
                onFocus={focusInput}
                onBlur={blurInput}
                maxLength={200}
              />
            </div>

            {/* 2. Çekici yap — Craving */}
            <div style={fieldStyle}>
              <label htmlFor="habit-craving" style={labelStyle}>
                ✨ İstek — bunu yapmak sana ne hissettiriyor?
              </label>
              <input
                id="habit-craving"
                type="text"
                style={inputStyle}
                placeholder="örn. Zekimi geliştirdiğimi hissediyorum"
                value={form.craving}
                onChange={(e) => set('craving', e.target.value)}
                onFocus={focusInput}
                onBlur={blurInput}
                maxLength={200}
              />
            </div>

            {/* 3. Kolay yap — 2 dakika */}
            <div style={fieldStyle}>
              <label htmlFor="habit-two-min" style={labelStyle}>
                ⚡ 2 dakika kuralı — en küçük hali ne?
              </label>
              <input
                id="habit-two-min"
                type="text"
                style={inputStyle}
                placeholder="örn. Sadece 1 sayfa aç"
                value={form.two_minute_version}
                onChange={(e) => set('two_minute_version', e.target.value)}
                onFocus={focusInput}
                onBlur={blurInput}
                maxLength={200}
              />
            </div>

            {/* 4. Tatmin edici yap — Stack on */}
            <div style={fieldStyle}>
              <label htmlFor="habit-stack" style={labelStyle}>
                🔗 Habit stacking — neyin hemen ardından?
              </label>
              <input
                id="habit-stack"
                type="text"
                style={inputStyle}
                placeholder="örn. Kahve içtikten hemen sonra"
                value={form.stack_on}
                onChange={(e) => set('stack_on', e.target.value)}
                onFocus={focusInput}
                onBlur={blurInput}
                maxLength={200}
              />
            </div>
          </div>
        </div>

        {/* İleri seçenekler (zamanlayıcı için — Adım 6'da kullanılacak) */}
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          style={{
            textAlign: 'left',
            fontSize: '0.8125rem',
            color: 'var(--color-muted)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0',
          }}
        >
          {showAdvanced ? '▲' : '▼'} Zamanlama seçenekleri (opsiyonel)
        </button>

        {showAdvanced && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ ...fieldStyle, flex: 1 }}>
              <label htmlFor="habit-time" style={labelStyle}>Tercih edilen saat</label>
              <input
                id="habit-time"
                type="time"
                style={inputStyle}
                value={form.preferred_time}
                onChange={(e) => set('preferred_time', e.target.value)}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </div>
            <div style={{ ...fieldStyle, flex: 1 }}>
              <label htmlFor="habit-duration" style={labelStyle}>Süre (dakika)</label>
              <input
                id="habit-duration"
                type="number"
                style={inputStyle}
                placeholder="15"
                min={1}
                max={240}
                value={form.duration_min}
                onChange={(e) => set('duration_min', e.target.value)}
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </div>
          </div>
        )}

        {/* Form butonları */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button
            type="submit"
            disabled={submitting || !form.name.trim()}
            style={{
              flex: 1,
              padding: '11px',
              background: submitting || !form.name.trim() ? 'var(--color-border)' : 'var(--color-accent)',
              color: submitting || !form.name.trim() ? 'var(--color-muted)' : '#fff',
              border: 'none',
              borderRadius: '10px',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 500,
              fontSize: '0.9375rem',
              cursor: submitting || !form.name.trim() ? 'not-allowed' : 'pointer',
              transition: 'background 150ms ease',
            }}
          >
            {submitting ? 'Ekleniyor…' : 'Alışkanlık Ekle'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            style={{
              padding: '11px 16px',
              background: 'transparent',
              color: 'var(--color-muted)',
              border: '1.5px solid var(--color-border)',
              borderRadius: '10px',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 500,
              fontSize: '0.9375rem',
              cursor: 'pointer',
            }}
          >
            İptal
          </button>
        </div>
      </div>
    </form>
  )
}

// --- Ana bileşen ---
export default function HabitTracker() {
  const [habits, setHabits] = useState([])
  const [identities, setIdentities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([fetchHabits(), fetchIdentities()])
  }, [])

  async function fetchHabits() {
    try {
      const data = await getHabits()
      setHabits(data)
    } catch {
      setError('Alışkanlıklar yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }

  async function fetchIdentities() {
    try {
      const data = await getIdentities()
      setIdentities(data)
    } catch {
      // Kimlikler yüklenemese bile tracker çalışsın
    }
  }

  async function handleAdd(payload) {
    const newHabit = await addHabit(payload)
    setHabits((prev) => [...prev, newHabit])
    setShowForm(false)
  }

  async function handleToggle(id) {
    setError('')
    try {
      const result = await toggleHabitLog(id)
      // Sadece değişen alışkanlığın today_completed'ını güncelle
      setHabits((prev) =>
        prev.map((h) => {
          if (h.id !== id) return h
          const newCompleted = result.completed
          // Streak: tamamlandıysa streak +1 mantığı server'da; basit UI güncellemesi
          // Tam doğru streak için yeniden fetch yapmak gerekir ama anlık dokunuşa yeterli
          return {
            ...h,
            today_completed: newCompleted,
            // Tamamlandıysa en az 1 streak göster; geri alındıysa düşür
            streak: newCompleted ? Math.max(h.streak, 1) : Math.max(h.streak - 1, 0),
            never_miss_twice_alert: false,
          }
        })
      )
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id) {
    setError('')
    try {
      await deleteHabit(id)
      setHabits((prev) => prev.filter((h) => h.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  const completedToday = habits.filter((h) => h.today_completed).length
  const totalActive = habits.length

  return (
    <section aria-labelledby="habits-heading">
      {/* Başlık */}
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: showForm ? '16px' : '20px',
          gap: '12px',
        }}
      >
        <div>
          <h2
            id="habits-heading"
            className="font-display text-2xl font-semibold"
            style={{ color: 'var(--color-ink)' }}
          >
            Alışkanlıklarım
          </h2>
          {totalActive > 0 && (
            <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
              Bugün: <strong style={{ color: 'var(--color-ink)' }}>{completedToday}</strong> / {totalActive} tamamlandı
            </p>
          )}
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            aria-label="Yeni alışkanlık ekle"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'var(--color-accent)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'opacity 150ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Ekle
          </button>
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

      {/* Alışkanlık ekleme formu */}
      {showForm && (
        <AddHabitForm
          identities={identities}
          onAdd={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Alışkanlık listesi */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-muted)', fontSize: '0.9rem' }}>
          Yükleniyor…
        </div>
      ) : habits.length === 0 ? (
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border)',
            borderRadius: '20px',
            padding: '40px 24px',
            textAlign: 'center',
          }}
        >
          <p className="font-display italic text-lg" style={{ color: 'var(--color-ink)' }}>
            Henüz alışkanlık yok.
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            Küçük başla — 2 dakika kuralı ile bir adım at.
          </p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              style={{
                marginTop: '16px',
                padding: '10px 20px',
                background: 'var(--color-accent)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontFamily: "'Inter', system-ui, sans-serif",
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              İlk alışkanlığı ekle
            </button>
          )}
        </div>
      ) : (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {habits.map((habit) => (
            <HabitItem
              key={habit.id}
              habit={habit}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      )}

      {/* Yapay zekâ önerileri */}
      <AISuggestions
        section="aliskanliklar"
        onAdd={async (payload) => {
          const newHabit = await addHabit(payload)
          setHabits((prev) => [...prev, { ...newHabit, today_completed: 0, streak: 0, recent_logs: [], never_miss_twice_alert: false }])
        }}
      />
    </section>
  )
}
