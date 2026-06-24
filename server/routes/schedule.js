// routes/schedule.js — Günlük program oluşturma
//
// GET  /api/schedule/propose?date=YYYY-MM-DD → önerilen blokları döndür (kaydetmez)
// POST /api/schedule/confirm                 → bloklari daily_goals'a kaydet
// POST /api/schedule/clear?date=YYYY-MM-DD  → o günün hedeflerini temizle

const express = require('express')
const db = require('../db')
const { generateSchedule } = require('../scheduler')

const router = express.Router()

function today() {
  return new Date().toISOString().split('T')[0]
}

// GET /api/schedule/propose — aktif alışkanlıklardan program öner (preview, kaydedilmez)
router.get('/propose', (req, res) => {
  const date = req.query.date || today()

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Geçersiz tarih formatı.' })
  }

  try {
    const habits = db.prepare(
      'SELECT * FROM habits WHERE active = 1 ORDER BY preferred_time ASC NULLS LAST, id ASC'
    ).all()

    if (!habits.length) {
      return res.json({ blocks: [], message: 'Aktif alışkanlık yok. Önce alışkanlık ekle.' })
    }

    const blocks = generateSchedule(habits, date)
    res.json({ blocks, date })
  } catch (err) {
    console.error('Program önerilemedi:', err.message)
    res.status(500).json({ error: 'Program önerilemedi.' })
  }
})

// POST /api/schedule/confirm — önerilen blokları kaydet
// Body: { date, blocks: [{title, linked_habit_id, start_time, end_time}], clearExisting: true }
router.post('/confirm', (req, res) => {
  const { date, blocks, clearExisting = true } = req.body

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Geçerli bir tarih gönderilmeli.' })
  }
  if (!Array.isArray(blocks) || !blocks.length) {
    return res.status(400).json({ error: 'Kaydedilecek blok yok.' })
  }

  // node:sqlite'ın db.transaction() metodu yok; manuel BEGIN/COMMIT kullanıyoruz
  try {
    db.exec('BEGIN')

    if (clearExisting) {
      // Yalnızca alışkanlıktan oluşturulan blokları sil.
      // Manuel eklenen hedefler (linked_habit_id IS NULL) korunur.
      db.prepare('DELETE FROM daily_goals WHERE date = ? AND linked_habit_id IS NOT NULL').run(date)
    }

    const insert = db.prepare(`
      INSERT INTO daily_goals (title, date, start_time, end_time, linked_habit_id, done)
      VALUES (?, ?, ?, ?, ?, 0)
    `)

    for (const block of blocks) {
      if (!block.title?.trim()) continue
      insert.run(
        block.title.trim(),
        date,
        block.start_time || null,
        block.end_time || null,
        block.linked_habit_id || null,
      )
    }

    db.exec('COMMIT')

    const saved = db.prepare(
      'SELECT * FROM daily_goals WHERE date = ? ORDER BY start_time ASC NULLS LAST'
    ).all(date)

    res.status(201).json({ goals: saved, date })
  } catch (err) {
    db.exec('ROLLBACK')
    console.error('Program kaydedilemedi:', err.message)
    res.status(500).json({ error: 'Program kaydedilemedi.' })
  }
})

// POST /api/schedule/clear — o günün hedeflerini sil
router.post('/clear', (req, res) => {
  const date = req.query.date || today()

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Geçersiz tarih formatı.' })
  }

  try {
    const result = db.prepare('DELETE FROM daily_goals WHERE date = ?').run(date)
    res.json({ ok: true, deleted: result.changes })
  } catch (err) {
    res.status(500).json({ error: 'Hedefler silinemedi.' })
  }
})

module.exports = router
