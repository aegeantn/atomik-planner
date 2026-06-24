# Atomik Planner — Sohbet Özeti & Devam Talimatı

> Bu dosyayı yeni Claude Code oturumuna bağlamı aktarmak için oluşturdum.
> Yeni oturumda bu dosyayı göster ve "devam et" de.

---

## Proje Durumu: TÜM ADIMLAR TAMAMLANDI ✅

Proje kökü: `/Users/ege/Desktop/claude code planner`

### Tamamlanan Yol Haritası (CLAUDE.md Bölüm 11)

| # | Adım | Durum |
|---|------|-------|
| 1 | İskelet + npm kurulumları | ✅ |
| 2 | SQLite şeması + db.js | ✅ |
| 3 | Kimlik (identity) CRUD | ✅ |
| 4 | Habit Scorecard | ✅ |
| 5 | Alışkanlık ekleme + streak | ✅ |
| 6 | Günlük hedefler + scheduler.js | ✅ |
| 7 | frontend-design ile UI polish | ✅ |
| 8 | Google Calendar OAuth | ✅ |
| 9 | Akşam değerlendirmesi | ✅ |
| 10 | İlerleme görünümü (grafik) | ✅ |
| 11 | n8n webhook uçları | ✅ (backend hazır) |

---

## Şu An Yapılacak Tek Şey: n8n Workflow'larını Oluşturmak

### Neden yeni oturum gerekti?
n8n MCP bu oturumda eklendiği için araçları yüklenemedi. Yeni oturumda hazır olacak.

### n8n Bağlantı Bilgileri
- **n8n URL:** `https://n8n.n8nnaegeantn.cfd`
- **API URL (MCP için):** `https://n8n.n8nnaegeantn.cfd/api/v1`
- **MCP sunucu adı:** `n8n` (claude mcp list'te ✔ Connected görünmeli)

### Atomik Planner Webhook Endpoint'leri (hazır, çalışıyor)
```
GET  http://localhost:3000/api/n8n/daily-summary?date=YYYY-MM-DD
POST http://localhost:3000/api/n8n/carry-over        body: {"date":"YYYY-MM-DD"}
GET  http://localhost:3000/api/n8n/morning-briefing?date=YYYY-MM-DD
```

### Oluşturulacak 3 Workflow

**1. Gün Sonu Özeti** — Her akşam 21:00
- Schedule Trigger (cron: `0 21 * * *`)
- HTTP Request → `GET /api/n8n/daily-summary`
- Code node → e-posta metni formatla
- Gmail node → `egetezcan62@gmail.com`'a gönder

**2. Tamamlanmayan Hedefleri Taşı** — Her gece 23:55
- Schedule Trigger (cron: `55 23 * * *`)
- HTTP Request → `POST /api/n8n/carry-over` (body: `{"date":"{{$now.format('yyyy-MM-dd')}}"}`)
- Filter node → `carried > 0` ise devam
- Gmail node → taşınan hedefleri bildir

**3. Sabah Planı** — Her sabah 07:00
- Schedule Trigger (cron: `0 7 * * *`)
- HTTP Request → `GET /api/n8n/morning-briefing`
- Code node → sabah odağı + program formatla
- Gmail node → `egetezcan62@gmail.com`'a gönder

### Import hazır JSON dosyaları
`/Users/ege/Desktop/claude code planner/n8n-workflows/` içinde:
- `1-gun-sonu-ozeti.json`
- `2-hedef-tasima.json`
- `3-sabah-plani.json`

n8n UI'dan **Workflows → Import from file** ile de yüklenebilir.

---

## Uygulamayı Başlatma

```bash
cd "/Users/ege/Desktop/claude code planner"
npm run dev
# → Client: http://localhost:5173
# → Server: http://localhost:3000
```

## Uygulama Yapısı

```
client/src/components/
├── IdentityCard.jsx      # Kimlik beyanları
├── HabitScorecard.jsx    # Mevcut davranış farkındalığı
├── HabitTracker.jsx      # Alışkanlıklar + streak + mini takvim
├── DailySchedule.jsx     # Zaman-bloklu program + Google Calendar
├── EveningReview.jsx     # Akşam değerlendirmesi + sabah odağı
└── ProgressView.jsx      # Haftalık/aylık ilerleme grafiği

server/routes/
├── identities.js
├── scorecard.js
├── habits.js
├── goals.js
├── schedule.js
├── review.js
├── stats.js
├── calendar.js    # Google Calendar OAuth
└── n8n.js         # n8n webhook uçları

server/
├── scheduler.js   # Zaman-blok algoritması
└── google-auth.js # OAuth 2.0 token yönetimi
```

## Önemli Notlar

### Google Calendar
- `GOOGLE_CLIENT_SECRET` sohbette paylaşıldı → **YANMIŞ** → Google Cloud Console'dan yenisi üretilmeli
- `.env` dosyasındaki `GOOGLE_CLIENT_SECRET` satırını yeni değerle güncelle
- Adım 8'e kadar çalışmaz; Calendar entegrasyonu Adım 8 için

### Tech Stack
- **Node.js:** v26.3.0 (better-sqlite3 uyumsuz → `node:sqlite` kullanıldı)
- **SQLite:** `node:sqlite` (yerleşik, kurulum gerektirmez)
- **Frontend:** React 18 + Vite 5 + Tailwind v4
- **Backend:** Express 4

### Tasarım Sistemi
- Font: Fraunces (display/italic) + Inter (UI)
- Accent: `#7C3AED` violet
- Background: `#F8F7F4` sıcak parşömen
- CSS tokens: `--color-accent`, `--color-success`, `--color-canvas`, vb.

---

## Yeni Oturumda Claude'a Söylenecek

> "SOHBET_OZETI.md dosyasını oku. n8n MCP artık bağlı, 3 workflow'u n8n üzerinden oluştur:
> gün sonu özeti (akşam 21:00), hedef taşıma (gece 23:55), sabah planı (07:00).
> Planner webhook'ları localhost:3000'de hazır."
