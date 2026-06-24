// routes/identities.js — Kimlik beyanları CRUD
// GET /api/identities       → hepsini listele
// POST /api/identities      → yeni ekle
// DELETE /api/identities/:id → sil

const express = require('express')
const db = require('../db')

const router = express.Router()

// GET /api/identities — tüm kimlik beyanları (en yeni başta)
router.get('/', (req, res) => {
  try {
    const rows = db.prepare(
      'SELECT * FROM identities ORDER BY created_at DESC, id DESC'
    ).all()
    res.json(rows)
  } catch (err) {
    console.error('Kimlikler alınamadı:', err.message)
    res.status(500).json({ error: 'Kimlikler alınamadı. Sunucu hatası.' })
  }
})

// POST /api/identities — yeni kimlik beyanı ekle
router.post('/', (req, res) => {
  const { statement } = req.body

  // Girdi doğrulaması: boş veya sadece boşluk karakterlerinden oluşan metin reddedilir
  if (!statement || !statement.trim()) {
    return res.status(400).json({ error: 'Kimlik beyanı boş olamaz.' })
  }

  const trimmed = statement.trim()

  // Çok uzun girdileri reddet
  if (trimmed.length > 300) {
    return res.status(400).json({ error: 'Kimlik beyanı en fazla 300 karakter olabilir.' })
  }

  try {
    // RETURNING * — eklenen satırı doğrudan geri döndürür (SQLite 3.35+)
    const row = db.prepare(
      'INSERT INTO identities (statement) VALUES (?) RETURNING *'
    ).get(trimmed)
    res.status(201).json(row)
  } catch (err) {
    console.error('Kimlik eklenemedi:', err.message)
    res.status(500).json({ error: 'Kimlik eklenemedi. Sunucu hatası.' })
  }
})

// DELETE /api/identities/:id — kimlik beyanını sil
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id)

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Geçersiz kimlik ID.' })
  }

  try {
    const result = db.prepare('DELETE FROM identities WHERE id = ?').run(id)

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Kimlik bulunamadı.' })
    }

    res.json({ ok: true })
  } catch (err) {
    console.error('Kimlik silinemedi:', err.message)
    res.status(500).json({ error: 'Kimlik silinemedi. Sunucu hatası.' })
  }
})

module.exports = router
