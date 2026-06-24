// google-auth.js — OAuth 2.0 istemci ve token yönetimi
//
// Basit benzetme: Google'a "Atomik Planner adıma takvim etkinliği yazabilir misin?" diye soruyoruz.
// Google "evet" deyince bize bir TOKEN (anahtar) veriyor; bu anahtarı token.json'da saklıyoruz.
// Bir dahaki seferde tekrar sormaya gerek yok; anahtarı kullanırız.

const { google } = require('googleapis')
const fs = require('fs')
const path = require('path')

// data/ altında tutulur → tek bir Docker volume yeterli olur
const TOKEN_PATH = path.join(__dirname, '..', 'data', 'token.json')
const SCOPES = ['https://www.googleapis.com/auth/calendar.events']

// OAuth istemcisi oluştur (her seferinde .env'den okur)
function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  )
}

// Kullanıcıyı Google'a götürecek URL'yi üret
function getAuthUrl() {
  const client = createOAuthClient()
  return client.generateAuthUrl({
    access_type: 'offline', // refresh_token almak için
    scope: SCOPES,
    prompt: 'consent',      // refresh_token'ın her seferinde verilmesini garantile
  })
}

// token.json dosyası var mı? (= daha önce bağlandık mı?)
function tokenExists() {
  return fs.existsSync(TOKEN_PATH)
}

// Kaydedilmiş token'ı oku
function loadToken() {
  try {
    return JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'))
  } catch {
    return null
  }
}

// Token'ı diske kaydet
function saveToken(token) {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2))
  console.log('✅ Google token kaydedildi:', TOKEN_PATH)
}

// Kimlik doğrulanmış istemci döndür (token refresh dahil)
// Bağlantı yoksa null döner — caller kontrol etmeli
async function getAuthenticatedClient() {
  const token = loadToken()
  if (!token) return null

  const client = createOAuthClient()
  client.setCredentials(token)

  // googleapis token süresi dolduğunda 'tokens' event'ı fırlatır; güncellenmiş token'ı kaydet
  client.on('tokens', (newTokens) => {
    const merged = { ...token, ...newTokens }
    saveToken(merged)
  })

  return client
}

// Kimlik bilgilerinin yapılandırılıp yapılandırılmadığını kontrol et
function hasCredentials() {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    !process.env.GOOGLE_CLIENT_SECRET.includes('PLACEHOLDER') &&
    !process.env.GOOGLE_CLIENT_SECRET.includes('buraya')
  )
}

module.exports = {
  createOAuthClient,
  getAuthUrl,
  tokenExists,
  loadToken,
  saveToken,
  getAuthenticatedClient,
  hasCredentials,
}
