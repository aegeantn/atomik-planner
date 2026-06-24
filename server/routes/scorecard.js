// routes/scorecard.js — Habit Scorecard CRUD
// GET    /api/scorecard       → tüm mevcut davranışları listele
// POST   /api/scorecard       → yeni davranış ekle (varsayılan rating: nötr)
// PATCH  /api/scorecard/:id   → puanlamayı güncelle (iyi / nötr / kötü)
// DELETE /api/scorecard/:id   → davranışı sil

const express = require('express')
const db = require('../db')

const router = express.Router()

const VALID_RATINGS = ['iyi', 'nötr', 'kötü']

// GET /api/scorecard
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(
      'SELECT * FROM scorecard_items ORDER BY created_at DESC, id DESC'
    ).all()
    res.json(rows)
  } catch (err) {
    console.error('Scorecard alınamadı:', err.message)
    res.status(500).json({ error: 'Davranışlar alınamadı.' })
  }
})

// POST /api/scorecard
router.post('/', (req, res) => {
  const { behavior, rating = 'nötr' } = req.body

  if (!behavior || !behavior.trim()) {
    return res.status(400).json({ error: 'Davranış boş olamaz.' })
  }

  if (!VALID_RATINGS.includes(rating)) {
    return res.status(400).json({ error: 'Geçersiz puanlama. "iyi", "nötr" veya "kötü" olmalı.' })
  }

  const trimmed = behavior.trim()
  if (trimmed.length > 300) {
    return res.status(400).json({ error: 'Davranış en fazla 300 karakter olabilir.' })
  }

  try {
    const row = db.prepare(
      'INSERT INTO scorecard_items (behavior, rating) VALUES (?, ?) RETURNING *'
    ).get(trimmed, rating)
    res.status(201).json(row)
  } catch (err) {
    console.error('Davranış eklenemedi:', err.message)
    res.status(500).json({ error: 'Davranış eklenemedi.' })
  }
})

// PATCH /api/scorecard/:id — yalnızca rating güncellenir
router.patch('/:id', (req, res) => {
  const id = Number(req.params.id)
  const { rating } = req.body

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Geçersiz ID.' })
  }

  if (!VALID_RATINGS.includes(rating)) {
    return res.status(400).json({ error: 'Geçersiz puanlama.' })
  }

  try {
    const row = db.prepare(
      'UPDATE scorecard_items SET rating = ? WHERE id = ? RETURNING *'
    ).get(rating, id)

    if (!row) {
      return res.status(404).json({ error: 'Davranış bulunamadı.' })
    }

    res.json(row)
  } catch (err) {
    console.error('Rating güncellenemedi:', err.message)
    res.status(500).json({ error: 'Puanlama güncellenemedi.' })
  }
})

// DELETE /api/scorecard/:id
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id)

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Geçersiz ID.' })
  }

  try {
    const result = db.prepare('DELETE FROM scorecard_items WHERE id = ?').run(id)

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Davranış bulunamadı.' })
    }

    res.json({ ok: true })
  } catch (err) {
    console.error('Davranış silinemedi:', err.message)
    res.status(500).json({ error: 'Davranış silinemedi.' })
  }
})

module.exports = router
