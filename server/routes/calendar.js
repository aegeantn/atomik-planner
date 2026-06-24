// routes/calendar.js — Google Calendar entegrasyonu
//
// GET  /api/calendar/status   → bağlı mı, kimlik bilgileri var mı?
// GET  /api/calendar/auth-url → OAuth URL'si (kullanıcıyı Google'a yönlendir)
// POST /api/calendar/sync     → o günün hedeflerini takvime yaz/güncelle
// POST /api/calendar/disconnect → token.json'u sil
//
// OAuth callback /oauth2callback → server/index.js'den mount edilir (bkz. oauthCallback export'u)

const express = require('express')
const { google } = require('googleapis')
const fs = require('fs')
const path = require('path')
const db = require('../db')
const {
  getAuthUrl,
  tokenExists,
  saveToken,
  getAuthenticatedClient,
  hasCredentials,
  createOAuthClient,
} = require('../google-auth')

const router = express.Router()
const TIMEZONE = process.env.CALENDAR_TIMEZONE || 'Europe/Istanbul'
const TOKEN_PATH = path.join(__dirname, '..', '..', 'token.json')

// --- Zaman yardımcıları ---
function addMinutesToTime(time, mins) {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + mins
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

// --- GET /api/calendar/status ---
router.get('/status', (req, res) => {
  res.json({
    connected: tokenExists(),
    hasCredentials: hasCredentials(),
  })
})

// --- GET /api/calendar/auth-url ---
router.get('/auth-url', (req, res) => {
  if (!hasCredentials()) {
    return res.status(503).json({
      error: 'Google Calendar kimlik bilgileri yapılandırılmamış. .env dosyasındaki GOOGLE_CLIENT_SECRET değerini güncelle.',
    })
  }
  try {
    const url = getAuthUrl()
    res.json({ url })
  } catch (err) {
    console.error('Auth URL hatası:', err.message)
    res.status(500).json({ error: 'OAuth URL üretilemedi.' })
  }
})

// --- POST /api/calendar/sync ---
// O günün zaman bloğu olan hedeflerini takvime ekler/günceller.
// Her hedef için gcal_event_id kaydedilir — aynı hedef bir daha gönderilirse güncellenir.
router.post('/sync', async (req, res) => {
  const { date } = req.body

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Geçerli bir tarih gönderilmeli (YYYY-MM-DD).' })
  }

  const auth = await getAuthenticatedClient()
  if (!auth) {
    return res.status(401).json({ error: 'Google Calendar bağlantısı yok. Önce bağlan.' })
  }

  // Zaman bloğu olan hedefleri al
  const goals = db.prepare(`
    SELECT * FROM daily_goals
    WHERE date = ? AND start_time IS NOT NULL
    ORDER BY start_time ASC
  `).all(date)

  if (!goals.length) {
    return res.json({ synced: 0, total: 0, message: 'Zaman bloğu olan hedef yok.' })
  }

  const calendar = google.calendar({ version: 'v3', auth })
  const results = []

  for (const goal of goals) {
    const startTime = goal.start_time
    // end_time yoksa başlangıca 30 dk ekle
    const endTime = goal.end_time || addMinutesToTime(startTime, 30)

    const eventBody = {
      summary: goal.title,
      start: { dateTime: `${date}T${startTime}:00`, timeZone: TIMEZONE },
      end:   { dateTime: `${date}T${endTime}:00`,   timeZone: TIMEZONE },
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: 10 }],
      },
    }

    try {
      let eventId

      if (goal.gcal_event_id) {
        // Mevcut etkinliği güncelle (silinmiş olabilir, fallback: yeni oluştur)
        try {
          await calendar.events.update({
            calendarId: 'primary',
            eventId: goal.gcal_event_id,
            requestBody: eventBody,
          })
          eventId = goal.gcal_event_id
        } catch (updateErr) {
          // Etkinlik takvimde bulunamadı — yenisini oluştur
          const created = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: eventBody,
          })
          eventId = created.data.id
        }
      } else {
        const created = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: eventBody,
        })
        eventId = created.data.id
      }

      // event_id'yi veritabanına kaydet (mükerrer gönderimi önler)
      db.prepare('UPDATE daily_goals SET gcal_event_id = ? WHERE id = ?').run(eventId, goal.id)
      results.push({ id: goal.id, title: goal.title, eventId, ok: true })
    } catch (err) {
      console.error(`"${goal.title}" takvime eklenemedi:`, err.message)
      results.push({ id: goal.id, title: goal.title, ok: false, error: err.message })
    }
  }

  const synced = results.filter((r) => r.ok).length
  res.json({ synced, total: goals.length, results })
})

// --- POST /api/calendar/disconnect ---
router.post('/disconnect', (req, res) => {
  try {
    if (fs.existsSync(TOKEN_PATH)) fs.unlinkSync(TOKEN_PATH)
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Bağlantı kesilirken hata oluştu.' })
  }
})

// --- OAuth callback (index.js'de /oauth2callback olarak mount edilir) ---
// Benzetme: Google sana bir kod verdi (tek kullanımlık), biz bunu token'a çeviriyoruz.
async function oauthCallback(req, res) {
  const { code, error } = req.query
  const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

  if (error || !code) {
    console.error('OAuth hatası:', error)
    return res.redirect(`${CLIENT_URL}?calendar=error`)
  }

  try {
    const client = createOAuthClient()
    const { tokens } = await client.getToken(code)
    saveToken(tokens)
    res.redirect(`${CLIENT_URL}?calendar=connected`)
  } catch (err) {
    console.error('Token alınamadı:', err.message)
    res.redirect(`${CLIENT_URL}?calendar=error`)
  }
}

module.exports = router
module.exports.oauthCallback = oauthCallback
