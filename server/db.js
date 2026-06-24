// db.js — SQLite bağlantısı ve şema kurulumu
//
// Node.js 22.5+ içinde gelen yerleşik node:sqlite modülünü kullanıyoruz.
// Kurulum gerektirmez, native derleme sorunu yok.
// API, better-sqlite3 ile neredeyse aynı (senkron, basit).

const path = require('path')
const fs = require('fs')
const { DatabaseSync } = require('node:sqlite')

// data/ klasörü yoksa oluştur (ilk çalıştırmada otomatik)
const dataDir = path.join(__dirname, '..', 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'planner.db')

// Veritabanını aç; foreign key kısıtlamalarını başlatma seçeneğiyle etkinleştir
const db = new DatabaseSync(dbPath, { enableForeignKeyConstraints: true })

// WAL modu: eş zamanlı okuma/yazma için daha iyi performans
db.exec("PRAGMA journal_mode = WAL")

// Tüm tabloları oluştur (IF NOT EXISTS — güvenli, her başlatmada çalışır)
// Hepsini şimdi kurmak, sonraki adımlarda migration derdi çıkarmaz.
db.exec(`
  -- Kimlik beyanları: "Ben şöyle biriyim" ifadeleri
  CREATE TABLE IF NOT EXISTS identities (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    statement  TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- Dört Yasa'ya göre tasarlanmış alışkanlıklar
  CREATE TABLE IF NOT EXISTS habits (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    identity_id        INTEGER REFERENCES identities(id) ON DELETE SET NULL,
    name               TEXT    NOT NULL,
    cue                TEXT,
    craving            TEXT,
    two_minute_version TEXT,
    stack_on           TEXT,
    preferred_time     TEXT,
    duration_min       INTEGER NOT NULL DEFAULT 15,
    frequency          TEXT    NOT NULL DEFAULT 'daily',
    active             INTEGER NOT NULL DEFAULT 1,
    created_at         TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- Günlük tamamlanma kayıtları ("zinciri kırma")
  CREATE TABLE IF NOT EXISTS habit_logs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id   INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    date       TEXT    NOT NULL,
    completed  INTEGER NOT NULL DEFAULT 0,
    note       TEXT,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(habit_id, date)
  );

  -- Günlük zaman-bloklu hedefler
  CREATE TABLE IF NOT EXISTS daily_goals (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    date            TEXT    NOT NULL,
    title           TEXT    NOT NULL,
    start_time      TEXT,
    end_time        TEXT,
    linked_habit_id INTEGER REFERENCES habits(id) ON DELETE SET NULL,
    done            INTEGER NOT NULL DEFAULT 0,
    gcal_event_id   TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- Habit Scorecard: mevcut davranış farkındalığı
  CREATE TABLE IF NOT EXISTS scorecard_items (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    behavior   TEXT    NOT NULL,
    rating     TEXT    NOT NULL CHECK(rating IN ('iyi', 'nötr', 'kötü')),
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- Akşam değerlendirmeleri
  CREATE TABLE IF NOT EXISTS reviews (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    date            TEXT    NOT NULL UNIQUE,
    what_went_well  TEXT,
    what_to_improve TEXT,
    tomorrow_focus  TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`)

console.log('✅ Veritabanı hazır:', dbPath)

module.exports = db
