// routes/review.js — Akşam değerlendirmesi CRUD
//
// GET  /api/reviews?date=YYYY-MM-DD → o günün değerlendirmesi (yoksa null)
// POST /api/reviews                  → oluştur veya güncelle (upsert — günde 1 kayıt)
// GET  /api/reviews/morning-focus    → dünün "yarının odağı" → bugünün sabah odağı

const express = require('express')
const db = require('../db')

const router = express.Router()

function today() {
  return new Date().toISOString().split('T')[0]
}
function yesterday() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

// GET /api/reviews?date=YYYY-MM-DD
router.get('/', (req, res) => {
  const date = req.query.date || today()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Geçersiz tarih formatı.' })
  }
  try {
    const row = db.prepare('SELECT * FROM reviews WHERE date = ?').get(date)
    res.json(row || null)
  } catch (err) {
    console.error('Değerlendirme alınamadı:', err.message)
    res.status(500).json({ error: 'Değerlendirme alınamadı.' })
  }
})

// GET /api/reviews/morning-focus → dünün tomorrow_focus'u
router.get('/morning-focus', (req, res) => {
  try {
    const row = db.prepare(
      'SELECT tomorrow_focus, date FROM reviews WHERE date = ? AND tomorrow_focus IS NOT NULL'
    ).get(yesterday())
    res.json(row || null)
  } catch (err) {
    res.status(500).json({ error: 'Sabah odağı alınamadı.' })
  }
})

// POST /api/reviews — upsert (günde tek kayıt; date UNIQUE kısıtlaması var)
router.post('/', (req, res) => {
  const { date: bodyDate, what_went_well, what_to_improve, tomorrow_focus } = req.body
  const date = bodyDate || today()

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Geçersiz tarih formatı.' })
  }

  try {
    const row = db.prepare(`
      INSERT INTO reviews (date, what_went_well, what_to_improve, tomorrow_focus)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        what_went_well  = excluded.what_went_well,
        what_to_improve = excluded.what_to_improve,
        tomorrow_focus  = excluded.tomorrow_focus
      RETURNING *
    `).get(
      date,
      what_went_well?.trim()   || null,
      what_to_improve?.trim()  || null,
      tomorrow_focus?.trim()   || null,
    )
    res.json(row)
  } catch (err) {
    console.error('Değerlendirme kaydedilemedi:', err.message)
    res.status(500).json({ error: 'Değerlendirme kaydedilemedi.' })
  }
})

module.exports = router
