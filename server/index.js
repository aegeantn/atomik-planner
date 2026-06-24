// server/index.js — Express sunucusu giriş noktası
// Dotenv'i en başta yükle: diğer modüller process.env değerlerini kullanabilsin
require('dotenv').config()

const express = require('express')
const cors = require('cors')

// db.js'yi burada require etmek, sunucu başlarken tabloları oluşturur
// (routes klasörü de require ediyor ama erken başlatmak daha güvenli)
require('./db')

const app = express()
const PORT = process.env.PORT || 3000

// --- Middleware ---
// CORS: client (Vite :5173) ile sunucu (:3000) arasındaki iletişime izin verir
app.use(cors())
// JSON body parser: POST/PUT isteklerindeki body'yi req.body olarak okur
app.use(express.json())

// --- Rotalar ---

// Sağlık kontrolü: "Sunucu ayakta mı?" sorusunun cevabı
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() })
})

// Kimlik beyanları
app.use('/api/identities', require('./routes/identities'))

// Habit Scorecard
app.use('/api/scorecard', require('./routes/scorecard'))

// Alışkanlıklar + günlük log
app.use('/api/habits', require('./routes/habits'))

// Günlük hedefler
app.use('/api/goals', require('./routes/goals'))

// Günlük program (öneri + onay)
app.use('/api/schedule', require('./routes/schedule'))

// Akşam değerlendirmesi
app.use('/api/reviews', require('./routes/review'))

// İlerleme istatistikleri
app.use('/api/stats', require('./routes/stats'))

// n8n webhook uçları
app.use('/api/n8n', require('./routes/n8n'))

// Yapay zekâ önerileri (OpenRouter)
app.use('/api/ai', require('./routes/ai'))

// Google Calendar
const calendarRouter = require('./routes/calendar')
app.use('/api/calendar', calendarRouter)
// OAuth callback — redirect_uri Google Console'da bu URL olmalı
app.get('/oauth2callback', calendarRouter.oauthCallback)

// Production'da React build dosyalarını serve et
// (Vite proxy sadece dev'de çalışır; production'da Express üstlenir)
if (process.env.NODE_ENV === 'production') {
  const path = require('path')
  app.use(express.static(path.join(__dirname, '../client/dist')))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'))
  })
}

// --- Sunucuyu başlat ---
app.listen(PORT, () => {
  console.log(`✅ Atomik Planner sunucusu çalışıyor: http://localhost:${PORT}`)
  console.log(`   Sağlık kontrolü: http://localhost:${PORT}/api/health`)
})
