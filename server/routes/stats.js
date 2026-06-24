// routes/stats.js — İlerleme istatistikleri
//
// GET /api/stats?days=7|30
//   → overview (özet sayılar)
//   → daily   (günlük tamamlama oranı — bar chart için)
//   → habits  (alışkanlık bazlı streak + loglar)

const express = require('express')
const db = require('../db')

const router = express.Router()

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

// 'YYYY-MM-DD' string'ine gün ekle
function offsetDate(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// Son N günün tarih listesini oluştur (en eski → bugün)
function dateRange(days) {
  const today = todayStr()
  return Array.from({ length: days }, (_, i) => offsetDate(today, -(days - 1 - i)))
}

// Verilen log listesinden mevcut seriyi hesapla
function computeStreak(completedDateSet, today) {
  if (completedDateSet.size === 0) return 0
  const yesterday = offsetDate(today, -1)
  const start = completedDateSet.has(today) ? today : yesterday
  if (!completedDateSet.has(start)) return 0
  let streak = 0
  let cursor = start
  while (completedDateSet.has(cursor)) {
    streak++
    cursor = offsetDate(cursor, -1)
  }
  return streak
}

router.get('/', (req, res) => {
  const days = Math.min(Number(req.query.days) || 7, 90)
  const today = todayStr()
  const startDate = offsetDate(today, -(days - 1))

  try {
    // --- Özet ---
    const activeHabits = db.prepare(
      'SELECT COUNT(*) AS cnt FROM habits WHERE active = 1'
    ).get().cnt

    const completedToday = db.prepare(
      'SELECT COUNT(*) AS cnt FROM habit_logs WHERE date = ? AND completed = 1'
    ).get(today).cnt

    const totalCompletions = db.prepare(
      'SELECT COUNT(*) AS cnt FROM habit_logs WHERE completed = 1'
    ).get().cnt

    const daysTracked = db.prepare(
      'SELECT COUNT(DISTINCT date) AS cnt FROM habit_logs WHERE completed = 1'
    ).get().cnt

    // --- Günlük tamamlama oranı (bar chart) ---
    // Tüm alışkanlıkları bugünkü sayı üzerinden normalize et
    const logsByDate = db.prepare(`
      SELECT date, SUM(completed) AS completed_count
      FROM habit_logs
      WHERE date >= ? AND date <= ? AND completed = 1
      GROUP BY date
    `).all(startDate, today)

    const logMap = {}
    for (const row of logsByDate) logMap[row.date] = row.completed_count

    const daily = dateRange(days).map((date) => ({
      date,
      completed: logMap[date] || 0,
      rate: activeHabits > 0 ? (logMap[date] || 0) / activeHabits : 0,
      isToday: date === today,
    }))

    // --- Alışkanlık bazlı istatistikler ---
    const habits = db.prepare(
      'SELECT * FROM habits WHERE active = 1 ORDER BY created_at ASC'
    ).all()

    const habitStats = habits.map((habit) => {
      const logs = db.prepare(`
        SELECT date, completed FROM habit_logs
        WHERE habit_id = ? AND date >= ? AND date <= ?
        ORDER BY date ASC
      `).all(habit.id, startDate, today)

      // date → completed map
      const logMap = {}
      for (const l of logs) logMap[l.date] = l.completed

      // Tüm period boyunca completedDays
      const completedDays = Object.values(logMap).filter(Boolean).length

      // Seri hesabı (tüm zamanlar için tüm logları çek)
      const allLogs = db.prepare(
        'SELECT date FROM habit_logs WHERE habit_id = ? AND completed = 1'
      ).all(habit.id)
      const completedSet = new Set(allLogs.map((l) => l.date))
      const streak = computeStreak(completedSet, today)

      return {
        id: habit.id,
        name: habit.name,
        streak,
        completedDays,
        totalDays: days,
        rate: days > 0 ? completedDays / days : 0,
        logs: logMap, // date → 0|1, period içinde kayıt olan günler
      }
    })

    res.json({
      period: days,
      overview: { activeHabits, completedToday, totalCompletions, daysTracked },
      daily,
      habits: habitStats,
    })
  } catch (err) {
    console.error('İstatistik alınamadı:', err.message)
    res.status(500).json({ error: 'İstatistik alınamadı.' })
  }
})

module.exports = router
