// routes/n8n.js — n8n otomasyonları için webhook uçları
//
// n8n bu uçları HTTP node'ları ile çağırır.
// Tüm uçlar JSON döner; n8n workflow'ları bu veriyi kullanır.
//
// 3 otomasyon:
// GET  /api/n8n/daily-summary          → gün sonu özeti (tamamlanma oranı + habit detayı)
// POST /api/n8n/carry-over             → tamamlanmayan hedefleri ertesi güne taşı
// GET  /api/n8n/morning-briefing       → sabah planı (bugünkü zaman blokları)

const express = require('express')
const db = require('../db')

const router = express.Router()

function todayStr() {
  return new Date().toISOString().split('T')[0]
}
function tomorrowStr() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}
function offsetDate(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// ------------------------------------------------------------------
// GET /api/n8n/daily-summary?date=YYYY-MM-DD
//
// n8n her akşam 21:00'de bu ucu çeker.
// Döndürülenler: genel tamamlanma oranı + alışkanlık bazlı özet.
// n8n bu veriyi biçimlendirip e-posta / Telegram gönderir.
// ------------------------------------------------------------------
router.get('/daily-summary', (req, res) => {
  const date = req.query.date || todayStr()

  try {
    const habits = db.prepare('SELECT * FROM habits WHERE active = 1').all()

    const habitSummary = habits.map((habit) => {
      const log = db.prepare(
        'SELECT completed FROM habit_logs WHERE habit_id = ? AND date = ?'
      ).get(habit.id, date)
      return {
        name: habit.name,
        completed: log ? Boolean(log.completed) : false,
        two_minute_version: habit.two_minute_version,
      }
    })

    const completedCount = habitSummary.filter((h) => h.completed).length
    const totalCount = habitSummary.length
    const rate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

    // O günkü hedefler
    const goals = db.prepare(
      'SELECT title, start_time, end_time, done FROM daily_goals WHERE date = ? ORDER BY start_time ASC NULLS LAST'
    ).all(date)
    const goalsDone = goals.filter((g) => g.done).length

    // Akşam değerlendirmesi varsa ekle
    const review = db.prepare('SELECT * FROM reviews WHERE date = ?').get(date)

    res.json({
      date,
      habits: {
        completed: completedCount,
        total: totalCount,
        rate,
        items: habitSummary,
      },
      goals: {
        completed: goalsDone,
        total: goals.length,
        items: goals,
      },
      review: review
        ? {
            what_went_well: review.what_went_well,
            what_to_improve: review.what_to_improve,
            tomorrow_focus: review.tomorrow_focus,
          }
        : null,
    })
  } catch (err) {
    console.error('daily-summary hatası:', err.message)
    res.status(500).json({ error: 'Özet alınamadı.' })
  }
})

// ------------------------------------------------------------------
// POST /api/n8n/carry-over
// Body: { date?: "YYYY-MM-DD" }  (varsayılan: bugün)
//
// n8n gece 23:55'te bu ucu tetikler.
// done=false olan hedefleri ertesi güne kopyalar (gcal_event_id sıfırlanır).
// Mükerrer koruması: aynı title + tarih çifti zaten varsa atlar.
// ------------------------------------------------------------------
router.post('/carry-over', (req, res) => {
  const date = req.body?.date || todayStr()
  const nextDate = offsetDate(date, 1)

  try {
    const undone = db.prepare(
      'SELECT * FROM daily_goals WHERE date = ? AND done = 0'
    ).all(date)

    if (!undone.length) {
      return res.json({ carried: 0, date, nextDate, message: 'Taşınacak hedef yok.' })
    }

    const checkExists = db.prepare(
      'SELECT COUNT(*) AS cnt FROM daily_goals WHERE date = ? AND title = ?'
    )
    const insert = db.prepare(
      'INSERT INTO daily_goals (title, date, start_time, end_time, linked_habit_id, done) VALUES (?, ?, ?, ?, ?, 0)'
    )

    let carried = 0
    for (const goal of undone) {
      // Mükerrer koruma: ertesi gün aynı başlıkta hedef varsa atla
      if (checkExists.get(nextDate, goal.title).cnt === 0) {
        insert.run(goal.title, nextDate, goal.start_time, goal.end_time, goal.linked_habit_id)
        carried++
      }
    }

    res.json({
      carried,
      skipped: undone.length - carried,
      date,
      nextDate,
      items: undone.map((g) => g.title),
    })
  } catch (err) {
    console.error('carry-over hatası:', err.message)
    res.status(500).json({ error: 'Hedefler taşınamadı.' })
  }
})

// ------------------------------------------------------------------
// GET /api/n8n/morning-briefing?date=YYYY-MM-DD
//
// n8n her sabah 07:00'de bu ucu çeker.
// Döndürülenler: bugünkü zaman-blok programı + dün gece yazılan sabah odağı.
// n8n e-posta / Telegram ile sabah bildirimi gönderir.
// ------------------------------------------------------------------
router.get('/morning-briefing', (req, res) => {
  const date = req.query.date || todayStr()

  try {
    const goals = db.prepare(`
      SELECT title, start_time, end_time, linked_habit_id
      FROM daily_goals
      WHERE date = ?
      ORDER BY start_time ASC NULLS LAST
    `).all(date)

    // Sabah odağı: dünün tomorrow_focus'u
    const yesterday = offsetDate(date, -1)
    const morningFocus = db.prepare(
      'SELECT tomorrow_focus FROM reviews WHERE date = ? AND tomorrow_focus IS NOT NULL'
    ).get(yesterday)

    // Bugün aktif alışkanlıklar (hatırlatma için)
    const habits = db.prepare(
      'SELECT name, preferred_time, two_minute_version FROM habits WHERE active = 1 ORDER BY preferred_time ASC NULLS LAST'
    ).all()

    res.json({
      date,
      morning_focus: morningFocus?.tomorrow_focus || null,
      schedule: goals,
      active_habits: habits,
      has_schedule: goals.length > 0,
    })
  } catch (err) {
    console.error('morning-briefing hatası:', err.message)
    res.status(500).json({ error: 'Sabah planı alınamadı.' })
  }
})

module.exports = router
