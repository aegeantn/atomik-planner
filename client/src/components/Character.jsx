// Character.jsx — Tier'a göre CSS 3D SVG karakter
// Her tier farklı bir karakter görünümü ve animasyonu taşır.
// Teknik: SVG gradient katmanları + CSS 3D filter + float animasyonu

export default function Character({ tier = 1 }) {
  return (
    <div className="character-float" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {tier === 1 && <Caylan />}
      {tier === 2 && <Azimli />}
      {tier === 3 && <Disiplinli />}
      {tier === 4 && <Kahraman />}
      {tier === 5 && <Efsane />}
    </div>
  )
}

// ─── Tier 1: Çaylak ──────────────────────────────────────────
// Küçük, yuvarlak, uyuklayan figür. Gri-kahve tonlar.
function Caylan() {
  return (
    <svg
      width="160" height="160"
      viewBox="0 0 100 100"
      fill="none"
      style={{ filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.15))', transform: 'scale(0.85)' }}
    >
      <defs>
        <radialGradient id="c1-body" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#D4C5A9" />
          <stop offset="100%" stopColor="#A08060" />
        </radialGradient>
        <radialGradient id="c1-face" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#F5E6C8" />
          <stop offset="100%" stopColor="#D4A870" />
        </radialGradient>
      </defs>

      {/* Gölge */}
      <ellipse cx="50" cy="94" rx="22" ry="5" fill="rgba(0,0,0,0.12)" />

      {/* Gövde — yuvarlak, küçük */}
      <ellipse cx="50" cy="65" rx="22" ry="24" fill="url(#c1-body)" />

      {/* Kol sağ */}
      <ellipse cx="74" cy="68" rx="7" ry="5" fill="#A08060" transform="rotate(20 74 68)" />
      {/* Kol sol */}
      <ellipse cx="26" cy="68" rx="7" ry="5" fill="#A08060" transform="rotate(-20 26 68)" />

      {/* Baş */}
      <circle cx="50" cy="42" r="20" fill="url(#c1-face)" />
      {/* Hacim gölgesi baş */}
      <ellipse cx="58" cy="48" rx="10" ry="8" fill="rgba(160,110,60,0.2)" />

      {/* Uyuklayan gözler — kapalı çizgiler */}
      <path d="M40 41 Q43 39 46 41" stroke="#6B4F2A" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M54 41 Q57 39 60 41" stroke="#6B4F2A" strokeWidth="1.8" strokeLinecap="round" fill="none" />

      {/* Uyku z'ları */}
      <text x="68" y="28" fontSize="7" fill="#A08060" fontFamily="serif" opacity="0.8">z</text>
      <text x="74" y="20" fontSize="9" fill="#A08060" fontFamily="serif" opacity="0.6">z</text>
      <text x="80" y="13" fontSize="11" fill="#A08060" fontFamily="serif" opacity="0.4">z</text>

      {/* Ağız — hafif düşük */}
      <path d="M44 50 Q50 48 56 50" stroke="#6B4F2A" strokeWidth="1.5" strokeLinecap="round" fill="none" />

      {/* Şapka */}
      <ellipse cx="50" cy="25" rx="18" ry="4" fill="#8B7355" />
      <rect x="38" y="10" width="24" height="16" rx="4" fill="#7A6245" />
    </svg>
  )
}

// ─── Tier 2: Azimli ──────────────────────────────────────────
// Ayağa kalkmış, yumruk kaldıran figür. Marigold aksanlar.
function Azimli() {
  return (
    <svg
      width="160" height="170"
      viewBox="0 0 100 110"
      fill="none"
      style={{ filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.18))' }}
    >
      <defs>
        <radialGradient id="c2-body" cx="38%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#5C8AE6" />
          <stop offset="100%" stopColor="#2D5FC4" />
        </radialGradient>
        <radialGradient id="c2-face" cx="42%" cy="38%" r="55%">
          <stop offset="0%" stopColor="#FDDBA0" />
          <stop offset="100%" stopColor="#D4A050" />
        </radialGradient>
      </defs>

      {/* Gölge */}
      <ellipse cx="50" cy="106" rx="24" ry="5" fill="rgba(0,0,0,0.14)" />

      {/* Bacaklar */}
      <rect x="38" y="80" width="10" height="22" rx="5" fill="#1E3F9A" />
      <rect x="52" y="80" width="10" height="22" rx="5" fill="#1E3F9A" />
      {/* Ayak */}
      <ellipse cx="43" cy="102" rx="8" ry="4" fill="#142B6E" />
      <ellipse cx="57" cy="102" rx="8" ry="4" fill="#142B6E" />

      {/* Gövde */}
      <rect x="32" y="52" width="36" height="32" rx="10" fill="url(#c2-body)" />

      {/* Marigold bant */}
      <rect x="32" y="64" width="36" height="6" fill="#F2B705" rx="2" />

      {/* Kol sol — aşağı */}
      <rect x="20" y="54" width="12" height="22" rx="6" fill="#2D5FC4" />
      <ellipse cx="26" cy="77" rx="7" ry="6" fill="#FDDBA0" />

      {/* Kol sağ — yukarı kaldırılmış (punch animasyonu) */}
      <g className="character-punch">
        <rect x="68" y="35" width="12" height="22" rx="6" fill="#2D5FC4" transform="rotate(-25 74 46)" />
        <ellipse cx="78" cy="36" rx="7" ry="6" fill="#FDDBA0" transform="rotate(-25 78 36)" />
      </g>

      {/* Baş */}
      <circle cx="50" cy="35" r="22" fill="url(#c2-face)" />
      <ellipse cx="58" cy="42" rx="11" ry="9" fill="rgba(180,120,40,0.2)" />

      {/* Gözler — açık, kararlı */}
      <circle cx="43" cy="33" r="4.5" fill="white" />
      <circle cx="57" cy="33" r="4.5" fill="white" />
      <circle cx="44" cy="34" r="2.5" fill="#1C1410" />
      <circle cx="58" cy="34" r="2.5" fill="#1C1410" />
      {/* Parlak nokta */}
      <circle cx="45" cy="33" r="1" fill="white" />
      <circle cx="59" cy="33" r="1" fill="white" />

      {/* Kaş — inen, kararlı */}
      <path d="M39 27 L47 29" stroke="#6B3E10" strokeWidth="2" strokeLinecap="round" />
      <path d="M53 29 L61 27" stroke="#6B3E10" strokeWidth="2" strokeLinecap="round" />

      {/* Ağız — küçük gülümseme */}
      <path d="M44 42 Q50 46 56 42" stroke="#8B4E10" strokeWidth="1.8" strokeLinecap="round" fill="none" />

      {/* Saç */}
      <path d="M30 28 Q35 12 50 12 Q65 12 70 28" fill="#3A2510" />
    </svg>
  )
}

// ─── Tier 3: Disiplinli ──────────────────────────────────────
// Zırhlı figür, güçlü duruş, koyu konturlar.
function Disiplinli() {
  return (
    <svg
      width="170" height="185"
      viewBox="0 0 100 110"
      fill="none"
      style={{ filter: 'drop-shadow(0 12px 20px rgba(0,0,0,0.22))' }}
    >
      <defs>
        <radialGradient id="c3-armor" cx="35%" cy="25%" r="65%">
          <stop offset="0%" stopColor="#8AACCC" />
          <stop offset="100%" stopColor="#3A6080" />
        </radialGradient>
        <radialGradient id="c3-face" cx="42%" cy="38%" r="55%">
          <stop offset="0%" stopColor="#FDDBA0" />
          <stop offset="100%" stopColor="#C49040" />
        </radialGradient>
        <linearGradient id="c3-shield" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F2B705" />
          <stop offset="100%" stopColor="#C88800" />
        </linearGradient>
      </defs>

      {/* Gölge */}
      <ellipse cx="50" cy="107" rx="28" ry="5.5" fill="rgba(0,0,0,0.18)" />

      {/* Bacaklar — zırhlı */}
      <rect x="35" y="78" width="13" height="25" rx="5" fill="#2A4A60" />
      <rect x="52" y="78" width="13" height="25" rx="5" fill="#2A4A60" />
      <ellipse cx="41" cy="103" rx="9" ry="4" fill="#1C3040" />
      <ellipse cx="58" cy="103" rx="9" ry="4" fill="#1C3040" />

      {/* Gövde zırh */}
      <path d="M28 55 L28 82 Q50 90 72 82 L72 55 Q50 48 28 55Z" fill="url(#c3-armor)" />
      {/* Zırh detay çizgileri */}
      <path d="M35 58 L35 80" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <path d="M65 58 L65 80" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <path d="M28 68 Q50 72 72 68" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" fill="none" />

      {/* Omuz plakaları */}
      <ellipse cx="28" cy="57" rx="10" ry="6" fill="#4A7A9A" transform="rotate(-10 28 57)" />
      <ellipse cx="72" cy="57" rx="10" ry="6" fill="#4A7A9A" transform="rotate(10 72 57)" />

      {/* Kollar */}
      <rect x="16" y="56" width="13" height="24" rx="6" fill="#3A6080" />
      <rect x="71" y="56" width="13" height="24" rx="6" fill="#3A6080" />
      <circle cx="22" cy="81" r="7" fill="#5A7A90" />
      <circle cx="78" cy="81" r="7" fill="#5A7A90" />

      {/* Kalkan — sol el */}
      <path d="M8 72 L8 90 Q16 96 24 90 L24 72 Q16 68 8 72Z" fill="url(#c3-shield)" />
      <path d="M16 74 L16 88" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
      <path d="M10 81 L22 81" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />

      {/* Baş */}
      <circle cx="50" cy="32" r="23" fill="url(#c3-face)" />
      <ellipse cx="60" cy="40" rx="12" ry="9" fill="rgba(160,100,30,0.2)" />

      {/* Miğfer */}
      <path d="M28 32 Q30 12 50 10 Q70 12 72 32" fill="#3A6080" />
      <rect x="34" y="26" width="32" height="6" rx="2" fill="#2A4A60" />

      {/* Gözler — güçlü */}
      <ellipse cx="43" cy="35" rx="5" ry="4" fill="white" />
      <ellipse cx="57" cy="35" rx="5" ry="4" fill="white" />
      <circle cx="44" cy="36" r="3" fill="#1C1410" />
      <circle cx="58" cy="36" r="3" fill="#1C1410" />
      <circle cx="45" cy="35" r="1.2" fill="white" />
      <circle cx="59" cy="35" r="1.2" fill="white" />

      {/* Ağız — sabit çizgi */}
      <path d="M43 44 L57 44" stroke="#8B5020" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

// ─── Tier 4: Kahraman ────────────────────────────────────────
// Pelerin, marigold ışık efekti, güçlü poz.
function Kahraman() {
  return (
    <svg
      width="185" height="200"
      viewBox="0 0 110 120"
      fill="none"
      style={{ filter: 'drop-shadow(0 0 18px rgba(242,183,5,0.4)) drop-shadow(0 14px 24px rgba(0,0,0,0.25))', transform: 'scale(1.05)' }}
    >
      <defs>
        <radialGradient id="c4-body" cx="35%" cy="25%" r="60%">
          <stop offset="0%" stopColor="#A060D0" />
          <stop offset="100%" stopColor="#5A1080" />
        </radialGradient>
        <radialGradient id="c4-face" cx="42%" cy="38%" r="55%">
          <stop offset="0%" stopColor="#FDDBA0" />
          <stop offset="100%" stopColor="#C49040" />
        </radialGradient>
        <linearGradient id="c4-cape" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#F2B705" />
          <stop offset="60%" stopColor="#C88800" />
          <stop offset="100%" stopColor="#8B5E00" />
        </linearGradient>
        <radialGradient id="c4-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(242,183,5,0.3)" />
          <stop offset="100%" stopColor="rgba(242,183,5,0)" />
        </radialGradient>
      </defs>

      {/* Parıltı halkası (arka) */}
      <circle cx="55" cy="55" r="52" fill="url(#c4-glow)" />

      {/* Gölge */}
      <ellipse cx="55" cy="116" rx="32" ry="6" fill="rgba(0,0,0,0.2)" />

      {/* Pelerin */}
      <path d="M28 58 Q15 80 18 110 L45 95 L55 100 L65 95 L92 110 Q95 80 82 58 Q55 68 28 58Z"
        fill="url(#c4-cape)" />
      {/* Pelerin iç kenarı */}
      <path d="M35 60 Q55 72 75 60" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" />

      {/* Bacaklar */}
      <rect x="40" y="85" width="13" height="26" rx="6" fill="#3A0860" />
      <rect x="57" y="85" width="13" height="26" rx="6" fill="#3A0860" />
      <ellipse cx="46" cy="111" rx="10" ry="4.5" fill="#280540" />
      <ellipse cx="63" cy="111" rx="10" ry="4.5" fill="#280540" />

      {/* Gövde */}
      <path d="M32 55 L32 88 Q55 96 78 88 L78 55 Q55 47 32 55Z" fill="url(#c4-body)" />
      {/* Marigold rozet */}
      <circle cx="55" cy="70" r="8" fill="#F2B705" />
      <text x="51" y="74" fontSize="9" fill="white" fontFamily="serif">★</text>

      {/* Omuzlar */}
      <circle cx="32" cy="58" r="10" fill="#7030A0" />
      <circle cx="78" cy="58" r="10" fill="#7030A0" />
      {/* Omuz altın kenar */}
      <circle cx="32" cy="58" r="10" stroke="#F2B705" strokeWidth="2" fill="none" />
      <circle cx="78" cy="58" r="10" stroke="#F2B705" strokeWidth="2" fill="none" />

      {/* Kollar */}
      <rect x="18" y="58" width="15" height="26" rx="7" fill="#5A1080" />
      <rect x="77" y="58" width="15" height="26" rx="7" fill="#5A1080" />
      {/* Ellerden enerji çıkışı */}
      <circle cx="25" cy="85" r="9" fill="#F2B705" opacity="0.9" />
      <circle cx="85" cy="85" r="9" fill="#F2B705" opacity="0.9" />
      <circle cx="25" cy="85" r="5" fill="white" opacity="0.8" />
      <circle cx="85" cy="85" r="5" fill="white" opacity="0.8" />

      {/* Baş */}
      <circle cx="55" cy="32" r="24" fill="url(#c4-face)" />
      <ellipse cx="64" cy="40" rx="12" ry="9" fill="rgba(160,100,30,0.2)" />

      {/* Saç / kask üstü */}
      <path d="M32 28 Q38 8 55 6 Q72 8 78 28" fill="#2A0840" />
      {/* Altın kask kenarı */}
      <path d="M33 30 Q55 22 77 30" stroke="#F2B705" strokeWidth="2.5" fill="none" />

      {/* Gözler — parlayan */}
      <ellipse cx="46" cy="35" rx="6" ry="5" fill="white" />
      <ellipse cx="64" cy="35" rx="6" ry="5" fill="white" />
      <circle cx="47" cy="36" r="3.5" fill="#F2B705" />
      <circle cx="65" cy="36" r="3.5" fill="#F2B705" />
      <circle cx="47" cy="36" r="2" fill="#1C1410" />
      <circle cx="65" cy="36" r="2" fill="#1C1410" />
      <circle cx="48" cy="35" r="1" fill="white" />
      <circle cx="66" cy="35" r="1" fill="white" />

      {/* Ağız — kendinden emin gülümseme */}
      <path d="M46 44 Q55 50 64 44" stroke="#8B5020" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  )
}

// ─── Tier 5: Efsane ──────────────────────────────────────────
// Dönen altın hale, maksimum parıltı, altın rengi.
function Efsane() {
  return (
    <svg
      width="200" height="215"
      viewBox="0 0 120 130"
      fill="none"
      style={{ filter: 'drop-shadow(0 0 28px rgba(242,183,5,0.7)) drop-shadow(0 16px 30px rgba(0,0,0,0.3))', transform: 'scale(1.08)' }}
    >
      <defs>
        <radialGradient id="c5-body" cx="35%" cy="25%" r="60%">
          <stop offset="0%" stopColor="#FFD060" />
          <stop offset="100%" stopColor="#B8700A" />
        </radialGradient>
        <radialGradient id="c5-face" cx="42%" cy="38%" r="55%">
          <stop offset="0%" stopColor="#FFF0C0" />
          <stop offset="100%" stopColor="#E0A840" />
        </radialGradient>
        <linearGradient id="c5-cape" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stopColor="#FFE44D" />
          <stop offset="100%" stopColor="#9A6B00" />
        </linearGradient>
        <radialGradient id="c5-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(242,183,5,0.5)" />
          <stop offset="100%" stopColor="rgba(242,183,5,0)" />
        </radialGradient>
      </defs>

      {/* Büyük parıltı halkası */}
      <circle cx="60" cy="60" r="58" fill="url(#c5-glow)" />

      {/* Dönen dış hale */}
      <g className="character-halo" style={{ transformOrigin: '60px 60px' }}>
        {[0,45,90,135,180,225,270,315].map((deg, i) => {
          const rad = (deg * Math.PI) / 180
          const x = 60 + 52 * Math.cos(rad)
          const y = 60 + 52 * Math.sin(rad)
          return <circle key={i} cx={x} cy={y} r={i % 2 === 0 ? 4 : 2.5} fill="#F2B705" opacity={i % 2 === 0 ? 0.9 : 0.5} />
        })}
        <circle cx="60" cy="60" r="50" stroke="#F2B705" strokeWidth="1.5" strokeDasharray="6 4" fill="none" opacity="0.6" />
      </g>

      {/* Gölge */}
      <ellipse cx="60" cy="126" rx="36" ry="6.5" fill="rgba(0,0,0,0.22)" />

      {/* Pelerin */}
      <path d="M32 60 Q16 85 20 120 L50 102 L60 108 L70 102 L100 120 Q104 85 88 60 Q60 72 32 60Z"
        fill="url(#c5-cape)" />
      <path d="M38 62 Q60 76 82 62" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none" />

      {/* Bacaklar */}
      <rect x="44" y="92" width="14" height="28" rx="7" fill="#9A6B00" />
      <rect x="62" y="92" width="14" height="28" rx="7" fill="#9A6B00" />
      <ellipse cx="51" cy="120" rx="11" ry="5" fill="#7A5000" />
      <ellipse cx="69" cy="120" rx="11" ry="5" fill="#7A5000" />

      {/* Gövde — altın */}
      <path d="M34 58 L34 95 Q60 104 86 95 L86 58 Q60 50 34 58Z" fill="url(#c5-body)" />
      {/* Merkez kristal */}
      <polygon points="60,62 66,70 60,78 54,70" fill="white" opacity="0.9" />
      <polygon points="60,62 66,70 60,78 54,70" stroke="#F2B705" strokeWidth="1.5" fill="none" />

      {/* Omuzlar */}
      <circle cx="34" cy="62" r="12" fill="#D4900A" />
      <circle cx="86" cy="62" r="12" fill="#D4900A" />
      <circle cx="34" cy="62" r="12" stroke="white" strokeWidth="2" fill="none" opacity="0.6" />
      <circle cx="86" cy="62" r="12" stroke="white" strokeWidth="2" fill="none" opacity="0.6" />

      {/* Kollar */}
      <rect x="19" y="62" width="16" height="28" rx="8" fill="#B8700A" />
      <rect x="85" y="62" width="16" height="28" rx="8" fill="#B8700A" />
      {/* Enerji elleri */}
      <circle cx="27" cy="91" r="10" fill="#FFE44D" />
      <circle cx="93" cy="91" r="10" fill="#FFE44D" />
      <circle cx="27" cy="91" r="6" fill="white" />
      <circle cx="93" cy="91" r="6" fill="white" />
      <circle cx="27" cy="91" r="3" fill="#F2B705" />
      <circle cx="93" cy="91" r="3" fill="#F2B705" />

      {/* Baş */}
      <circle cx="60" cy="34" r="25" fill="url(#c5-face)" />
      <ellipse cx="70" cy="43" rx="13" ry="10" fill="rgba(200,140,40,0.2)" />

      {/* Altın taç */}
      <path d="M36 28 L42 14 L50 22 L60 10 L70 22 L78 14 L84 28" fill="#F2B705" />
      <circle cx="60" cy="11" r="4" fill="white" />
      <circle cx="42" cy="15" r="3" fill="#FFD060" />
      <circle cx="78" cy="15" r="3" fill="#FFD060" />

      {/* Gözler — altın parlayan */}
      <ellipse cx="50" cy="36" rx="6.5" ry="5.5" fill="white" />
      <ellipse cx="70" cy="36" rx="6.5" ry="5.5" fill="white" />
      <circle cx="51" cy="37" r="4" fill="#F2B705" />
      <circle cx="71" cy="37" r="4" fill="#F2B705" />
      <circle cx="51" cy="37" r="2" fill="#1C1410" />
      <circle cx="71" cy="37" r="2" fill="#1C1410" />
      <circle cx="52" cy="36" r="1.2" fill="white" />
      <circle cx="72" cy="36" r="1.2" fill="white" />

      {/* Gülümseme — büyük */}
      <path d="M48 46 Q60 54 72 46" stroke="#8B5010" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </svg>
  )
}
