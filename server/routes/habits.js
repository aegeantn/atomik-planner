// routes/habits.js — Alışkanlık CRUD + günlük log + streak
//
// GET    /api/habits            → aktif alışkanlıklar (streak + bugünkü log dahil)
// POST   /api/habits            → yeni alışkanlık ekle
// PATCH  /api/habits/:id        → güncelle (alan güncelleme / aktif toggle)
// DELETE /api/habits/:id        → sil (log'ları cascade ile siler)
// POST   /api/habits/:id/log    → bugünkü log'u aç/kapat (toggle)

const express = require('express')
const db = require('../db')

const router = express.Router()

// --- Yardımcı: streak hesapla ---
// logs: [{date: 'YYYY-MM-DD', completed: 0|1}] — tarihe göre DESC sıralı
// Bugün tamamlanmadıysa dünden saymaya başlar (günün sonuna kadar fırsat var).
function computeStreak(logs, today) {
  const completedDates = new Set(logs.filter((l) => l.completed).map((l) => l.date))
  if (completedDates.size === 0) return 0

  const yesterday = offsetDate(today, -1)
  const start = completedDates.has(today) ? today : yesterday
  if (!completedDates.has(start)) return 0

  let streak = 0
  let cursor = start
  while (completedDates.has(cursor)) {
    streak++
    cursor = offsetDate(cursor, -1)
  }
  return streak
}

// 'YYYY-MM-DD' string'ine gün ekle/çıkar
function offsetDate(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// Bugünün tarihini UTC'de al (server timezone bağımsızlığı)
function today() {
  return new Date().toISOString().split('T')[0]
}

// --- GET /api/habits ---
// Her alışkanlık için streak, bugünkü durum, son 21 günlük log ve "never miss twice" uyarısı döner.
router.get('/', (req, res) => {
  try {
    const habits = db.prepare(
      'SELECT * FROM habits WHERE active = 1 ORDER BY created_at ASC'
    ).all()

    const todayStr = today()
    const yesterdayStr = offsetDate(todayStr, -1)

    const enriched = habits.map((habit) => {
      // Son 21 günlük log (streak + mini takvim için yeterli)
      const logs = db.prepare(`
        SELECT date, completed FROM habit_logs
        WHERE habit_id = ?
        ORDER BY date DESC
        LIMIT 21
      `).all(habit.id)

      const todayLog = logs.find((l) => l.date === todayStr)
      const yesterdayLog = logs.find((l) => l.date === yesterdayStr)
      const streak = computeStreak(logs, todayStr)

      // "Never miss twice" uyarısı: dün tamamlanmadı VE bugün de tamamlanmadı
      const neverMissTwiceAlert =
        (!yesterdayLog || !yesterdayLog.completed) &&
        (!todayLog || !todayLog.completed)

      return {
        ...habit,
        today_completed: todayLog ? todayLog.completed : 0,
        streak,
        never_miss_twice_alert: neverMissTwiceAlert,
        recent_logs: logs, // son 21 gün, mini takvim için
      }
    })

    res.json(enriched)
  } catch (err) {
    console.error('Alışkanlıklar alınamadı:', err.message)
    res.status(500).json({ error: 'Alışkanlıklar alınamadı.' })
  }
})

// --- POST /api/habits ---
router.post('/', (req, res) => {
  const {
    name,
    identity_id,
    cue,
    craving,
    two_minute_version,
    stack_on,
    preferred_time,
    duration_min = 15,
    frequency = 'daily',
  } = req.body

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Alışkanlık adı boş olamaz.' })
  }
  if (name.trim().length > 200) {
    return res.status(400).json({ error: 'Alışkanlık adı en fazla 200 karakter olabilir.' })
  }

  try {
    const row = db.prepare(`
      INSERT INTO habits (name, identity_id, cue, craving, two_minute_version, stack_on, preferred_time, duration_min, frequency)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `).get(
      name.trim(),
      identity_id || null,
      cue?.trim() || null,
      craving?.trim() || null,
      two_minute_version?.trim() || null,
      stack_on?.trim() || null,
      preferred_time || null,
      Number(duration_min) || 15,
      frequency || 'daily',
    )

    // Yeni alışkanlık için streak=0, today_completed=0, boş log listesi
    res.status(201).json({ ...row, today_completed: 0, streak: 0, recent_logs: [], never_miss_twice_alert: false })
  } catch (err) {
    console.error('Alışkanlık eklenemedi:', err.message)
    res.status(500).json({ error: 'Alışkanlık eklenemedi.' })
  }
})

// --- PATCH /api/habits/:id ---
router.patch('/:id', (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Geçersiz ID.' })
  }

  const existing = db.prepare('SELECT * FROM habits WHERE id = ?').get(id)
  if (!existing) return res.status(404).json({ error: 'Alışkanlık bulunamadı.' })

  // Sadece gönderilen alanları güncelle (partial update)
  const allowed = ['name', 'identity_id', 'cue', 'craving', 'two_minute_version', 'stack_on', 'preferred_time', 'duration_min', 'frequency', 'active']
  const updates = {}
  for (const field of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      updates[field] = req.body[field]
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Güncellenecek alan yok.' })
  }

  const setClauses = Object.keys(updates).map((k) => `${k} = ?`).join(', ')
  const values = [...Object.values(updates), id]

  try {
    const row = db.prepare(`UPDATE habits SET ${setClauses} WHERE id = ? RETURNING *`).get(...values)
    res.json(row)
  } catch (err) {
    console.error('Alışkanlık güncellenemedi:', err.message)
    res.status(500).json({ error: 'Alışkanlık güncellenemedi.' })
  }
})

// --- DELETE /api/habits/:id ---
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Geçersiz ID.' })
  }

  try {
    const result = db.prepare('DELETE FROM habits WHERE id = ?').run(id)
    if (result.changes === 0) return res.status(404).json({ error: 'Alışkanlık bulunamadı.' })
    res.json({ ok: true })
  } catch (err) {
    console.error('Alışkanlık silinemedi:', err.message)
    res.status(500).json({ error: 'Alışkanlık silinemedi.' })
  }
})

// --- POST /api/habits/:id/log --- Bugünkü log'u aç/kapat
router.post('/:id/log', (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Geçersiz ID.' })
  }

  const habit = db.prepare('SELECT id FROM habits WHERE id = ?').get(id)
  if (!habit) return res.status(404).json({ error: 'Alışkanlık bulunamadı.' })

  const todayStr = today()
  const existing = db.prepare(
    'SELECT id, completed FROM habit_logs WHERE habit_id = ? AND date = ?'
  ).get(id, todayStr)

  try {
    let newCompleted
    if (existing) {
      // Mevcut log'u tersine çevir
      newCompleted = existing.completed ? 0 : 1
      db.prepare('UPDATE habit_logs SET completed = ? WHERE id = ?').run(newCompleted, existing.id)
    } else {
      // Bugün için ilk kez tamamlandı
      newCompleted = 1
      db.prepare('INSERT INTO habit_logs (habit_id, date, completed) VALUES (?, ?, 1)').run(id, todayStr)
    }

    res.json({ habit_id: id, date: todayStr, completed: newCompleted })
  } catch (err) {
    console.error('Log güncellenemedi:', err.message)
    res.status(500).json({ error: 'Log güncellenemedi.' })
  }
})

module.exports = router
