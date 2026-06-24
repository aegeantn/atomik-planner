// api.js — Sunucuyla iletişim yardımcıları
// Vite proxy sayesinde '/api' yeterli; tam URL yazmaya gerek yok.

const BASE = '/api'

/**
 * Temel fetch sarmalayıcı.
 * Başarısız isteklerde sunucudan gelen hata mesajını fırlatır.
 */
async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  const body = await res.json()

  if (!res.ok) {
    // Sunucu Türkçe hata mesajı döndürüyor; kullanıcıya olduğu gibi göster
    throw new Error(body.error || 'Beklenmeyen bir sunucu hatası oluştu.')
  }

  return body
}

// --- Kimlik beyanları ---


/** Tüm kimlik beyanlarını getir */
export const getIdentities = () => request('/identities')

/** Yeni kimlik beyanı ekle */
export const addIdentity = (statement) =>
  request('/identities', {
    method: 'POST',
    body: JSON.stringify({ statement }),
  })

/** Kimlik beyanını sil */
export const deleteIdentity = (id) =>
  request(`/identities/${id}`, { method: 'DELETE' })

// --- Habit Scorecard ---

/** Tüm scorecard öğelerini getir */
export const getScorecard = () => request('/scorecard')

/** Yeni davranış ekle (varsayılan rating: nötr) */
export const addScorecardItem = (behavior) =>
  request('/scorecard', {
    method: 'POST',
    body: JSON.stringify({ behavior, rating: 'nötr' }),
  })

/** Davranışın puanlamasını güncelle */
export const updateScorecardRating = (id, rating) =>
  request(`/scorecard/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ rating }),
  })

/** Scorecard öğesini sil */
export const deleteScorecardItem = (id) =>
  request(`/scorecard/${id}`, { method: 'DELETE' })

// --- Alışkanlıklar ---

/** Aktif alışkanlıkları (streak + bugünkü log dahil) getir */
export const getHabits = () => request('/habits')

/** Yeni alışkanlık ekle */
export const addHabit = (data) =>
  request('/habits', { method: 'POST', body: JSON.stringify(data) })

/** Alışkanlık güncelle (partial) */
export const updateHabit = (id, data) =>
  request(`/habits/${id}`, { method: 'PATCH', body: JSON.stringify(data) })

/** Alışkanlık sil */
export const deleteHabit = (id) =>
  request(`/habits/${id}`, { method: 'DELETE' })

/** Bugünkü log'u aç/kapat */
export const toggleHabitLog = (id) =>
  request(`/habits/${id}/log`, { method: 'POST' })

// --- Günlük hedefler ---

/** O günün hedeflerini getir */
export const getGoals = (date) =>
  request(`/goals?date=${date}`)

/** Manuel hedef ekle */
export const addGoal = (data) =>
  request('/goals', { method: 'POST', body: JSON.stringify(data) })

/** Hedef tamamlandı / geri al */
export const toggleGoalDone = (id, done) =>
  request(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify({ done: done ? 1 : 0 }) })

/** Hedef sil */
export const deleteGoal = (id) =>
  request(`/goals/${id}`, { method: 'DELETE' })

// --- Günlük program ---

/** Alışkanlıklardan program öner (kaydetmez, önizleme) */
export const proposeSchedule = (date) =>
  request(`/schedule/propose?date=${date}`)

/** Önerilen programı kaydet */
export const confirmSchedule = (date, blocks) =>
  request('/schedule/confirm', {
    method: 'POST',
    body: JSON.stringify({ date, blocks, clearExisting: true }),
  })

/** O günün hedeflerini temizle */
export const clearSchedule = (date) =>
  request(`/schedule/clear?date=${date}`, { method: 'POST' })

// --- İlerleme istatistikleri ---

/** Alışkanlık istatistiklerini getir */
export const getStats = (days = 7) => request(`/stats?days=${days}`)

// --- Akşam değerlendirmesi ---

/** O günün değerlendirmesini getir */
export const getReview = (date) => request(`/reviews?date=${date}`)

/** Sabah odağını getir (dünün tomorrow_focus'u) */
export const getMorningFocus = () => request('/reviews/morning-focus')

/** Değerlendirmeyi kaydet (upsert) */
export const saveReview = (data) =>
  request('/reviews', { method: 'POST', body: JSON.stringify(data) })

// --- Google Calendar ---

/** Takvim bağlantı durumunu kontrol et */
export const getCalendarStatus = () => request('/calendar/status')

/** OAuth URL'ini al (sonra window.location.href ile yönlendir) */
export const getCalendarAuthUrl = () => request('/calendar/auth-url')

/** O günün hedeflerini takvime gönder */
export const syncToCalendar = (date) =>
  request('/calendar/sync', { method: 'POST', body: JSON.stringify({ date }) })

/** Takvim bağlantısını kes (token.json sil) */
export const disconnectCalendar = () =>
  request('/calendar/disconnect', { method: 'POST' })
