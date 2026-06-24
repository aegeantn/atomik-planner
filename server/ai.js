// server/ai.js — OpenRouter üzerinden Atomic Habits tabanlı öneri üretimi
//
// Model: deepseek/deepseek-v4-flash (hızlı ve uygun maliyetli)
// Sağlayıcı: OpenRouter (OpenAI-uyumlu API)
// Bağımlılık: Node yerleşik fetch — ekstra paket gerekmez

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-v4-flash'

// API anahtarının yapılandırılıp yapılandırılmadığını kontrol et
function isEnabled() {
  return !!OPENROUTER_API_KEY
}

// --- Bölüme özel kullanıcı promptları ---
// Her bölüm kendi bağlamını (mevcut veriler) alır ve kitaba dayalı öneri ister.
const SECTION_PROMPTS = {
  kimlik: (ctx) => `Kullanıcının mevcut kimlik beyanları: ${
    ctx.identities?.length
      ? ctx.identities.map((i) => `"${i.statement}"`).join(', ')
      : 'henüz yok'
  }

Atomic Habits'e göre kimlik, alışkanlıkların temelidir. Mevcut listede olmayan 3 tane yeni kimlik beyanı öner. Her biri "Ben ... biriyim" formatında, küçük ve inandırıcı olsun.

Sadece şu JSON'u döndür (başka hiçbir şey ekleme):
{"suggestions": [
  {"title": "Beyan başlığı (kısa)", "detail": "Neden bu kimlik? 1-2 cümle.", "payload": {"statement": "Ben ... biriyim"}}
]}`,

  tarama: (ctx) => `Kullanıcının mevcut Habit Scorecard davranışları: ${
    ctx.items?.length
      ? ctx.items.map((i) => `"${i.behavior}"`).join(', ')
      : 'henüz yok'
  }

Atomic Habits'in Habit Scorecard aşaması için farklı hayat alanlarından (sağlık, üretkenlik, sosyal, öğrenme, dinlenme) 4 tane gözlemlenecek günlük davranış öner. Mevcut listede olmayan davranışları seç.

Sadece şu JSON'u döndür:
{"suggestions": [
  {"title": "Davranış adı", "detail": "Neden gözlemlemeli? 1-2 cümle.", "payload": {"behavior": "Davranış açıklaması", "rating": "nötr"}}
]}`,

  aliskanliklar: (ctx) => `Kullanıcının kimlik beyanları: ${
    ctx.identities?.length
      ? ctx.identities.map((i) => `"${i.statement}"`).join(', ')
      : 'henüz yok'
  }
Mevcut alışkanlıkları: ${
    ctx.habits?.length
      ? ctx.habits.map((h) => `"${h.name}"`).join(', ')
      : 'henüz yok'
  }

Atomic Habits'in Dört Yasasına göre (Belirgin yap, Çekici yap, Kolay yap, Tatmin edici yap) 3 yeni alışkanlık öner. 2-dakika kuralını uygula; habit stacking kullan. Mevcut listede olmayan alışkanlıkları seç.

Sadece şu JSON'u döndür:
{"suggestions": [
  {
    "title": "Alışkanlık adı",
    "detail": "Dört Yasa açıklaması. 2-3 cümle.",
    "payload": {
      "name": "...",
      "cue": "... olduğunda / ... yaptıktan sonra",
      "two_minute_version": "Sadece 2 dakika: ...",
      "stack_on": "... yaptıktan sonra",
      "craving": "... hissetmek istiyorum",
      "duration_min": 15,
      "frequency": "daily"
    }
  }
]}`,

  program: (ctx) => `Bugünün tarihi: ${ctx.date}
Kullanıcının kimlik beyanları: ${
    ctx.identities?.length
      ? ctx.identities.map((i) => `"${i.statement}"`).join(', ')
      : 'henüz yok'
  }
Bugünkü mevcut hedefler: ${
    ctx.goals?.length
      ? ctx.goals.map((g) => `${g.start_time || '??:??'} ${g.title}`).join(', ')
      : 'henüz yok'
  }

Bugün için mevcut programa göre boşlukları dolduracak 3 zaman-bloklu hedef öner. Sabah / öğle / akşam dengesini gözet. Her hedef kimliği desteklemeli.

Sadece şu JSON'u döndür:
{"suggestions": [
  {
    "title": "Hedef adı",
    "detail": "Neden bu saat ve hedef? 1-2 cümle.",
    "payload": {"title": "...", "start_time": "HH:MM", "end_time": "HH:MM", "date": "${ctx.date}"}
  }
]}`,
}

// --- Ana öneri fonksiyonu ---
async function getSuggestions({ section, context }) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY yapılandırılmamış. Sunucu .env dosyasını kontrol et.')
  }

  const promptFn = SECTION_PROMPTS[section]
  if (!promptFn) {
    throw new Error(`Bilinmeyen bölüm: ${section}`)
  }

  const systemPrompt = `Sen James Clear'ın Atomic Habits kitabına dayalı çalışan bir kişisel gelişim asistanısın.
Temel prensipler: Dört Yasa (Belirgin yap / Çekici yap / Kolay yap / Tatmin edici yap),
kimlik temelli alışkanlıklar, 2-dakika kuralı, habit stacking, sistemler > hedefler,
"never miss twice", ortam tasarımı ve %1 günlük birikim.
Tüm yanıtlarını Türkçe ver. Kısa, somut ve uygulanabilir öneriler sun.
Sadece geçerli JSON döndür, başka hiçbir açıklama ekleme.`

  const userPrompt = promptFn(context)

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://planner.n8nnaegeantn.cfd',
      'X-Title': 'Atomik Planner',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1024,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`OpenRouter API hatası (${response.status}): ${errText}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('AI yanıtı boş döndü.')
  }

  let parsed
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error('AI yanıtı geçerli JSON değil.')
  }

  if (!Array.isArray(parsed.suggestions)) {
    throw new Error('AI yanıtında "suggestions" dizisi bulunamadı.')
  }

  return parsed.suggestions
}

module.exports = { getSuggestions, isEnabled }
