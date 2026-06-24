// scheduler.js — Günlük zaman-blok program üreticisi
//
// Algoritma:
// 1. Aktif alışkanlıkları preferred_time'a göre sırala (zaman olmayanlar sona)
// 2. Her alışkanlık için başlangıç = max(preferred_time, cursor)
// 3. cursor'u bitiş + 5 dk buffer ile ilerlet (çakışma önleme)
// 4. Sonuç: daily_goals tablosuna yazılmaya hazır blok listesi

const DEFAULT_START = '09:00' // Tercih belirtilmeyen alışkanlıklar için başlangıç
const BUFFER_MINUTES = 5      // Bloklar arası boşluk

function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(mins) {
  const h = Math.floor(mins / 60) % 24
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * @param {Array} habits — aktif alışkanlıklar [{id, name, preferred_time, duration_min, ...}]
 * @param {string} date  — 'YYYY-MM-DD'
 * @returns {Array}      — daily_goals formatında blok listesi (henüz kaydedilmemiş)
 */
function generateSchedule(habits, date) {
  if (!habits.length) return []

  // Tercih edilen saate göre sırala; saati olmayanlar sona
  const sorted = [...habits].sort((a, b) => {
    if (!a.preferred_time && !b.preferred_time) return 0
    if (!a.preferred_time) return 1
    if (!b.preferred_time) return -1
    return timeToMinutes(a.preferred_time) - timeToMinutes(b.preferred_time)
  })

  let cursor = timeToMinutes(DEFAULT_START)
  const blocks = []

  for (const habit of sorted) {
    const preferredStart = habit.preferred_time
      ? timeToMinutes(habit.preferred_time)
      : null

    // Tercih edilen saat ile cursor'dan büyük olanı al (çakışma önleme)
    const start = preferredStart !== null
      ? Math.max(preferredStart, cursor)
      : cursor

    const duration = habit.duration_min || 15
    const end = start + duration

    blocks.push({
      title: habit.name,
      linked_habit_id: habit.id,
      date,
      start_time: minutesToTime(start),
      end_time: minutesToTime(end),
      done: 0,
    })

    cursor = end + BUFFER_MINUTES
  }

  return blocks
}

module.exports = { generateSchedule }
