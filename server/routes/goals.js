// routes/goals.js — Günlük hedef CRUD
//
// GET    /api/goals?date=YYYY-MM-DD  → o günün hedefleri (start_time'a göre sıralı)
// POST   /api/goals                  → tek hedef ekle
// PATCH  /api/goals/:id              → done toggle / alan güncelleme
// DELETE /api/goals/:id              → hedef sil

const express = require('express')
const db = require('../db')

const router = express.Router()

function today() {
  return new Date().toISOString().split('T')[0]
}

// GET /api/goals
router.get('/', (req, res) => {
  const date = req.query.date || today()

  // Basit tarih formatı doğrulaması
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Geçersiz tarih formatı. YYYY-MM-DD bekleniyor.' })
  }

  try {
    const rows = db.prepare(`
      SELECT g.*, h.name AS habit_name, h.cue
      FROM daily_goals g
      LEFT JOIN habits h ON g.linked_habit_id = h.id
      WHERE g.date = ?
      ORDER BY g.start_time ASC NULLS LAST, g.id ASC
    `).all(date)
    res.json(rows)
  } catch (err) {
    console.error('Hedefler alınamadı:', err.message)
    res.status(500).json({ error: 'Hedefler alınamadı.' })
  }
})

// POST /api/goals
router.post('/', (req, res) => {
  const {
    title,
    date: goalDate,
    start_time,
    end_time,
    linked_habit_id,
    done = 0,
  } = req.body

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Hedef başlığı boş olamaz.' })
  }

  const dateToUse = goalDate || today()

  try {
    const row = db.prepare(`
      INSERT INTO daily_goals (title, date, start_time, end_time, linked_habit_id, done)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING *
    `).get(
      title.trim(),
      dateToUse,
      start_time || null,
      end_time || null,
      linked_habit_id || null,
      done ? 1 : 0,
    )
    res.status(201).json(row)
  } catch (err) {
    console.error('Hedef eklenemedi:', err.message)
    res.status(500).json({ error: 'Hedef eklenemedi.' })
  }
})

// PATCH /api/goals/:id
router.patch('/:id', (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Geçersiz ID.' })
  }

  const existing = db.prepare('SELECT * FROM daily_goals WHERE id = ?').get(id)
  if (!existing) return res.status(404).json({ error: 'Hedef bulunamadı.' })

  const allowed = ['title', 'start_time', 'end_time', 'done', 'linked_habit_id', 'gcal_event_id']
  const updates = {}
  for (const field of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      updates[field] = req.body[field]
    }
  }

  if (!Object.keys(updates).length) {
    return res.status(400).json({ error: 'Güncellenecek alan yok.' })
  }

  const setClauses = Object.keys(updates).map((k) => `${k} = ?`).join(', ')

  try {
    const row = db.prepare(
      `UPDATE daily_goals SET ${setClauses} WHERE id = ? RETURNING *`
    ).get(...Object.values(updates), id)
    res.json(row)
  } catch (err) {
    console.error('Hedef güncellenemedi:', err.message)
    res.status(500).json({ error: 'Hedef güncellenemedi.' })
  }
})

// DELETE /api/goals/:id
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Geçersiz ID.' })
  }

  try {
    const result = db.prepare('DELETE FROM daily_goals WHERE id = ?').run(id)
    if (result.changes === 0) return res.status(404).json({ error: 'Hedef bulunamadı.' })
    res.json({ ok: true })
  } catch (err) {
    console.error('Hedef silinemedi:', err.message)
    res.status(500).json({ error: 'Hedef silinemedi.' })
  }
})

module.exports = router
