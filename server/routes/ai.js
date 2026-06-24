// routes/ai.js — Yapay zekâ öneri uçları
//
// GET  /api/ai/status   → { enabled: true/false }  (API anahtarı var mı?)
// POST /api/ai/suggest  → { suggestions: [...] }    (bölüme özel öneriler)

const express = require('express')
const db = require('../db')
const { getSuggestions, isEnabled } = require('../ai')

const router = express.Router()

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

// --- GET /api/ai/status ---
// Frontend bu uç ile API'nin etkin olup olmadığını kontrol eder.
// Anahtar yoksa "Öneri al" butonu hiç gösterilmez.
router.get('/status', (_req, res) => {
  res.json({ enabled: isEnabled() })
})

// --- POST /api/ai/suggest ---
// body: { section: 'kimlik' | 'tarama' | 'aliskanliklar' | 'program' }
router.post('/suggest', async (req, res) => {
  const { section } = req.body

  if (!section) {
    return res.status(400).json({ error: 'section alanı zorunlu.' })
  }

  const validSections = ['kimlik', 'tarama', 'aliskanliklar', 'program']
  if (!validSections.includes(section)) {
    return res.status(400).json({ error: `Geçersiz section: ${section}` })
  }

  if (!isEnabled()) {
    return res.status(503).json({
      error: 'Yapay zekâ önerileri şu an etkin değil. Sunucuya OPENROUTER_API_KEY eklenmeli.',
    })
  }

  try {
    // Bölüme göre ilgili DB verilerini topla
    let context = {}
    const today = todayStr()

    if (section === 'kimlik') {
      context.identities = db.prepare('SELECT statement FROM identities ORDER BY created_at DESC LIMIT 20').all()
    }

    if (section === 'tarama') {
      context.items = db.prepare('SELECT behavior, rating FROM scorecard_items ORDER BY created_at DESC LIMIT 20').all()
    }

    if (section === 'aliskanliklar') {
      context.identities = db.prepare('SELECT statement FROM identities ORDER BY created_at DESC LIMIT 10').all()
      context.habits = db.prepare('SELECT name FROM habits WHERE active = 1 ORDER BY created_at DESC LIMIT 20').all()
    }

    if (section === 'program') {
      context.date = today
      context.identities = db.prepare('SELECT statement FROM identities ORDER BY created_at DESC LIMIT 10').all()
      context.goals = db.prepare(
        'SELECT title, start_time, end_time FROM daily_goals WHERE date = ? ORDER BY start_time ASC'
      ).all(today)
    }

    const suggestions = await getSuggestions({ section, context })
    res.json({ suggestions })
  } catch (err) {
    console.error('AI öneri hatası:', err.message)
    res.status(500).json({ error: err.message || 'Yapay zekâ önerisi alınamadı.' })
  }
})

module.exports = router
