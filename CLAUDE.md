# CLAUDE.md — Atomik Planner (Kişisel Gelişim & Günlük Hedef Sistemi)

Bu dosya, Claude Code'un bu projede nasıl davranacağını tanımlar. Amaç: James Clear'ın **Atomic Habits** kitabının prensipleri üzerine kurulu, **localde çalışan**, **Google Calendar'a bağlı**, beni gün içinde **zaman bloklarına göre programlayan** bir kişisel gelişim ve günlük planlama uygulaması.

---

## 1. Proje Özeti

Web tabanlı, kullanıcının makinesinde (localhost) çalışan bir "atomik planner". Kullanıcı kimlik beyanları ve küçük alışkanlıklar tanımlar; sistem her gün için bir **zaman bloklu program** oluşturur ("bugün 09:00'da şunu, 14:00'te bunu yapacaksın"), ilerlemeyi takip eder ve her şeyi Google Calendar ile senkronize eder. n8n ile de gün sonu özeti / taşıma gibi otomasyonlara bağlanır.

**Temel felsefe (kitaptan):**
- **%1 gelişim:** Her gün %1 daha iyi olmak yılda ~37x birikimli getiri sağlar. Büyük hedefler değil, küçük ve tutarlı eylemler.
- **Kimlik temelli alışkanlıklar:** "Şunu yapmak istiyorum" yerine "Ben şöyle biriyim". Hedefler kimliğe bağlanır.
- **Hedefler değil sistemler:** Sonuçlara değil sürece odaklan.
- **Dört Yasa (Four Laws of Behavior Change):**
  1. **Belirgin yap (Cue)** — niyet uygulaması, ortam tasarımı, habit stacking.
  2. **Çekici yap (Craving)** — temptation bundling, motivasyon.
  3. **Kolay yap (Response)** — 2 dakika kuralı, sürtünmeyi azalt.
  4. **Tatmin edici yap (Reward)** — anında ödül, habit tracker, "zinciri kırma".

---

## 2. Teknik Yığın (Tech Stack)

> Beni (Ege) n8n ve Claude Code'da yeni başlayan biri olarak kabul et. Karmaşık yapılardan kaçın, açıklayıcı yorum satırları ekle.

- **Frontend:** React + Vite + TailwindCSS (tek sayfa uygulama)
- **Backend:** Node.js + Express (basit REST API)
- **Veritabanı:** SQLite (kurulum gerektirmez, tek dosya, localde ideal)
- **Takvim entegrasyonu:** Google Calendar API (`googleapis` paketi, OAuth 2.0)
- **Otomasyon:** n8n (local, Docker veya `npx n8n`)
- **Çalışma ortamı:** Tamamen local — `npm run dev` ile ayağa kalkar.

---

## 3. Frontend Tasarım Kuralı (ÖNEMLİ)

Frontend'de (UI bileşenleri, sayfa düzeni, görsel kimlik) **mutlaka Claude'un `frontend-design` skill'i kullanılacak**. Yani:
- Herhangi bir React bileşeni veya ekran tasarlamadan **önce** `frontend-design` skill'ini oku ve oradaki tasarım jetonlarına (renk, tipografi, boşluk, bileşen stili) uy.
- Şablon gibi / jenerik görünen "default" tasarımdan kaçın; skill'in yönlendirdiği bilinçli ve özgün görsel dil kullanılsın.
- Tüm UI metinleri **Türkçe**.

---

## 4. Klasör Yapısı

```
atomik-planner/
├── CLAUDE.md
├── README.md
├── .env                  # Sırlar (ASLA commit etme)
├── .env.example
├── package.json
├── server/
│   ├── index.js
│   ├── db.js
│   ├── scheduler.js      # Günlük zaman-blok programını üretir
│   ├── routes/
│   │   ├── habits.js
│   │   ├── goals.js
│   │   ├── scorecard.js  # Habit scorecard
│   │   ├── review.js     # Akşam değerlendirmesi
│   │   └── calendar.js   # Google Calendar senkron
│   └── google-auth.js    # OAuth 2.0 akışı
├── client/
│   └── src/
│       ├── App.jsx
│       ├── components/
│       │   ├── DailySchedule.jsx    # Bugünün zaman-bloklu programı
│       │   ├── HabitScorecard.jsx   # Mevcut davranış farkındalığı
│       │   ├── HabitTracker.jsx     # Streak / "zinciri kırma"
│       │   ├── IdentityCard.jsx     # Kimlik beyanları
│       │   ├── EveningReview.jsx    # Gün sonu 2 dk değerlendirme
│       │   └── ProgressView.jsx
│       └── api.js
└── data/
    └── planner.db
```

---

## 5. Veri Modeli

**identities** — Kimlik beyanları
- `id`, `statement` ("Ben her gün öğrenen biriyim"), `created_at`

**habits** — Dört Yasa'ya göre tasarlanmış alışkanlıklar
- `id`, `identity_id`, `name`, `cue`, `craving`
- `two_minute_version` (2 dakika kuralı)
- `stack_on` (habit stacking)
- `preferred_time` (gün içinde önerilen saat — programlama için)
- `duration_min`, `frequency`, `active`

**habit_logs** — Tamamlanma kayıtları ("zinciri kırma")
- `id`, `habit_id`, `date`, `completed`, `note`

**daily_goals** — Günlük küçük hedefler
- `id`, `date`, `title`, `start_time`, `end_time` (zaman bloğu)
- `linked_habit_id`, `done`, `gcal_event_id`

**scorecard_items** — Habit Scorecard (mevcut davranış farkındalığı)
- `id`, `behavior`, `rating` ("iyi" / "nötr" / "kötü"), `created_at`

**reviews** — Akşam değerlendirmeleri
- `id`, `date`, `what_went_well`, `what_to_improve`, `tomorrow_focus`

---

## 6. Günlük Zaman-Blok Programlama (Çekirdek Özellik)

`scheduler.js` her sabah (veya kullanıcı "günümü planla" dediğinde) şunu yapar:
1. O gün aktif olan alışkanlıkları ve günlük hedefleri toplar.
2. Her birine `preferred_time` ve `duration_min`'e göre bir **zaman bloğu** atar; çakışmaları önler.
3. Sonuç bir günlük program: *"09:00–09:10 — 10 sayfa oku (Ben okuyan biriyim)"* gibi.
4. Kullanıcı onaylayınca bu bloklar hem `daily_goals`'a yazılır hem de **Google Calendar'a etkinlik olarak gönderilir** (her birine hatırlatma/bildirim ile).

Böylece takvim sana "bugün şu saatte şunu yapacaksın" diye hatırlatır.

---

## 7. Atomic Habits Mekanikleri (UI'a gömülecek)

- **Habit Scorecard:** Yeni alışkanlık kurmadan önce mevcut günlük davranışları listeleyip "iyi/nötr/kötü" işaretleme. Kitabın ilk adımı: farkındalık.
- **"Never miss twice":** Streak bir gün kırılırsa ceza yok; ama **iki gün üst üste** kaçırma riski olduğunda sistem ertesi gün için yumuşak ve öncelikli bir hatırlatma çıkarır. Mükemmeliyetçiliği değil tutarlılığı ödüllendir.
- **Akşam review + sabah odağı:** Günü 2 dakikalık "ne iyi gitti / neyi düzelteceğim / yarının odağı" notuyla kapatma (`EveningReview.jsx`). Kitabın "reflection and review" bölümü.
- **Streak görselleştirme:** Habit tracker'da zincir/takvim görünümü — "zinciri kırma" hissi.

---

## 8. Google Calendar Entegrasyonu — Notlar

> **GÜVENLİK UYARISI:** Sohbette paylaşılan API anahtarı yanmış sayılır; iptal edilip yenisi üretilmeli. Hiçbir anahtar/sır koda gömülmez, hepsi `.env`'de tutulur.


- Kullanıcının Google Cloud Console'da yapması gereken: **Credentials → Create OAuth client ID** → uygulama tipi seç → `client_id` ve `client_secret` al → `.env`'e koy. (Calendar API zaten enable edilmiş durumda.)
- Akış: kullanıcı bir kez Google'a izin verir, dönen token `token.json` olarak localde saklanır (`.gitignore`'da).
- **Yön:** Başlangıçta **tek yönlü** (uygulama → takvim). Bir hedef takvime eklenince dönen `event_id`, `daily_goals.gcal_event_id`'ye kaydedilir (mükerrer önlenir). Çift yönlü senkron faz 2.
- Gerekli scope: `https://www.googleapis.com/auth/calendar.events`

`.env.example` içeriği:
```
GOOGLE_CLIENT_ID=buraya
GOOGLE_CLIENT_SECRET=buraya
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback
PORT=3000
```

---

## 9. n8n Otomasyonları

n8n local çalışacak (`npx n8n` veya Docker). Planner, n8n'in tetikleyebilmesi için basit webhook/REST uçları sunar. Kurulacak iş akışları:

1. **Gün sonu özeti:** Her akşam 21:00'de planner'dan o günün tamamlanma oranını çek, özet e-posta gönder.
2. **Tamamlanmayan hedefi taşıma:** Gün biterken `done=false` olan hedefleri ertesi güne kopyala.
3. **Sabah planı bildirimi:** Sabah, o günün zaman-blok programını e-posta/Telegram ile gönder.

> n8n tarafında bana yeni başlayan biri gibi adım adım, benzetmelerle anlat. Her node'un ne işe yaradığını kısaca yaz.

---

## 10. Davranış Kuralları (Claude Code için)

1. **Türkçe yaz** — kod yorumları, commit mesajları, UI metinleri, açıklamalar.
2. **Token israfı yapma** — tüm dosyayı baştan yazma; sadece **değişen bölümü** ver ve yerini söyle.
3. **Küçük adımlarla ilerle** — her seferinde tek özellik; önce çalışan iskelet.
4. **Frontend'de `frontend-design` skill'ini kullan** (bkz. bölüm 3).
5. **Açıkla ama abartma** — yeni kavramı kısa benzetmeyle anlat, dolgu metin yok.
6. **Güvenlik** — sırlar `.env`'de; `.gitignore`'a `.env`, `data/*.db`, `token.json` ekle. Anahtarı asla koda gömme.
7. **Dürüst ol** — dezavantaj varsa söyle, bilmiyorsan tahmin etme.
8. **Çalıştırma talimatı ver** — her adımdan sonra net komut.

---

## 11. Geliştirme Sırası (Yol Haritası)

1. Proje iskeleti + npm kurulumları + boş çalışan localhost.
2. SQLite şeması + `db.js`.
3. Kimlik (identity) CRUD.
4. Habit Scorecard (mevcut davranış farkındalığı).
5. Alışkanlık ekleme (Dört Yasa alanlarıyla) + günlük log + streak.
6. Günlük hedefler + `scheduler.js` (zaman-blok programı).
7. `frontend-design` ile UI: DailySchedule, HabitTracker, IdentityCard.
8. Google Calendar OAuth + hedefi/bloğu takvime yazma.
9. Akşam review + sabah odağı.
10. İlerleme görünümü (haftalık/aylık grafik).
11. n8n otomasyonları için webhook uçları + iş akışları.

---

## 12. İlk Komut

Claude Code'a:
> "CLAUDE.md'yi oku. 11. bölümdeki yol haritasından sırasıyla başla.
