// Character.jsx — Bubu/Dudu tarzı sevimli ayı karakteri
// Tier'a göre görünümü ve animasyonu değişir.
// SVG animasyonları için CSS float + SVG animateTransform kullanılır.

export default function Character({ tier = 1 }) {
  return (
    <div
      className="character-float"
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
    >
      {tier === 1 && <T1Caylan />}
      {tier === 2 && <T2Azimli />}
      {tier === 3 && <T3Disiplinli />}
      {tier === 4 && <T4Kahraman />}
      {tier === 5 && <T5Efsane />}
    </div>
  )
}

// ── Ortak renk paleti ──────────────────────────────────────
const FUR   = '#C8966A'   // ana kürk
const EAR   = '#B07850'   // kulak dışı
const EAR_I = '#F0A898'   // kulak içi (pembe)
const CREAM = '#F0D8B0'   // yüz ortası açık krem
const DARK  = '#2A1508'   // göz / burun / ağız
const WHITE = '#FFFFFF'

// ── Temel kafa + gövde ────────────────────────────────────
// (svgProps ve color overrides ile tier başına özelleştirme)
function BearBase({
  furColor = FUR,
  eyeColor = DARK,
  eyeGlow  = false,
  smile    = 'normal',  // normal | big | tiny
  brows    = false,     // kaşlar (kararlı ifade)
  children,             // aksesuar katmanları (kıyafet, taç vb)
}) {
  const smilePath =
    smile === 'big'   ? 'M40 62 Q50 70 60 62' :
    smile === 'tiny'  ? 'M44 61 Q50 64 56 61' :
                        'M42 61 Q50 66 58 61'

  return (
    <>
      {/* Kulaklar */}
      <circle cx="26" cy="24" r="12" fill={EAR} />
      <circle cx="74" cy="24" r="12" fill={EAR} />
      <circle cx="26" cy="24" r="7"  fill={EAR_I} />
      <circle cx="74" cy="24" r="7"  fill={EAR_I} />

      {/* Kafa */}
      <circle cx="50" cy="50" r="30" fill={furColor} />
      {/* Hacim gölgesi (sağ alt) */}
      <ellipse cx="62" cy="60" rx="16" ry="12"
        fill="rgba(0,0,0,0.06)" />

      {/* Yüz ortası — krem bölge */}
      <ellipse cx="50" cy="57" rx="18" ry="15" fill={CREAM} />

      {/* Gözler */}
      <circle cx="39" cy="46" r="6" fill={eyeGlow ? '#F2B705' : DARK} />
      <circle cx="61" cy="46" r="6" fill={eyeGlow ? '#F2B705' : DARK} />
      {/* Göz iç */}
      <circle cx="39" cy="46" r="3.5" fill={eyeGlow ? '#FFE04D' : '#1A0C04'} />
      <circle cx="61" cy="46" r="3.5" fill={eyeGlow ? '#FFE04D' : '#1A0C04'} />
      {/* Parıltı */}
      <circle cx="41" cy="44" r="2" fill={WHITE} />
      <circle cx="63" cy="44" r="2" fill={WHITE} />

      {/* Kaşlar (kararlı ifade için) */}
      {brows && (
        <>
          <path d="M33 39 Q39 36 45 39" stroke={DARK} strokeWidth="2.2"
            strokeLinecap="round" fill="none" />
          <path d="M55 39 Q61 36 67 39" stroke={DARK} strokeWidth="2.2"
            strokeLinecap="round" fill="none" />
        </>
      )}

      {/* Burun */}
      <ellipse cx="50" cy="55" rx="3.5" ry="2.5" fill={DARK} />

      {/* Ağız */}
      <path d={smilePath} stroke={DARK} strokeWidth="1.8"
        strokeLinecap="round" fill="none" />

      {/* Yanak pembesi */}
      <ellipse cx="32" cy="60" rx="7" ry="5" fill="rgba(255,150,130,0.25)" />
      <ellipse cx="68" cy="60" rx="7" ry="5" fill="rgba(255,150,130,0.25)" />

      {/* Aksesuarlar (tier bazlı ek katmanlar) */}
      {children}

      {/* Gövde */}
      <ellipse cx="50" cy="96" rx="22" ry="18" fill={furColor} />
      {/* Gövde hacim */}
      <ellipse cx="57" cy="100" rx="12" ry="9" fill="rgba(0,0,0,0.06)" />
    </>
  )
}

// ── T1 Çaylak — El sallayan, sade ────────────────────────
function T1Caylan() {
  return (
    <svg width="150" height="170" viewBox="0 0 100 120"
      fill="none"
      style={{ filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.14))' }}
    >
      {/* Gölge */}
      <ellipse cx="50" cy="117" rx="22" ry="4.5" fill="rgba(0,0,0,0.1)" />

      <BearBase smile="tiny">
        {/* Sol kol — aşağıda */}
        <ellipse cx="25" cy="100" rx="8" ry="13" fill={FUR}
          transform="rotate(10 25 100)" />

        {/* Sağ kol — el sallıyor; pivot omuz noktası (75, 88) */}
        <g transform="translate(75, 88)">
          <ellipse cx="0" cy="10" rx="8" ry="13" fill={FUR}
            transform="rotate(-10)" />
          {/* El (küçük yuvarlak) */}
          <circle cx="-3" cy="22" r="6" fill={FUR} />
          {/* Parmaklar */}
          <circle cx="-8" cy="18" r="3" fill={FUR} />
          <circle cx="-9" cy="13" r="3" fill={FUR} />
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0; -55; 10; -55; 0"
            dur="1.1s"
            repeatCount="indefinite"
          />
        </g>
      </BearBase>
    </svg>
  )
}

// ── T2 Azimli — Yumruk kaldıran, bandanalı ───────────────
function T2Azimli() {
  return (
    <svg width="160" height="180" viewBox="0 0 100 120"
      fill="none"
      style={{ filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.16))' }}
    >
      <ellipse cx="50" cy="117" rx="24" ry="4.5" fill="rgba(0,0,0,0.12)" />

      <BearBase smile="normal" brows={true}>
        {/* Marigold kafa bandı */}
        <rect x="22" y="29" width="56" height="10" rx="5" fill="#F2B705" />
        {/* Bandaj düğüm sağda */}
        <ellipse cx="74" cy="34" rx="5" ry="4" fill="#E0A500" />

        {/* Sol kol — aşağıda */}
        <ellipse cx="25" cy="100" rx="8" ry="13" fill={FUR}
          transform="rotate(10 25 100)" />
        <circle cx="22" cy="112" r="7" fill={FUR} />

        {/* Sağ kol — yukarı kaldırılmış (yumruk) */}
        <g transform="translate(75, 88)">
          <ellipse cx="0" cy="-8" rx="8" ry="13" fill={FUR} />
          {/* Yumruk */}
          <rect x="-7" y="-24" width="14" height="12" rx="5" fill={FUR} />
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="-50; -60; -45; -60; -50"
            dur="1.4s"
            repeatCount="indefinite"
          />
        </g>
      </BearBase>
    </svg>
  )
}

// ── T3 Disiplinli — Zırhlı, rozetli ─────────────────────
function T3Disiplinli() {
  return (
    <svg width="165" height="185" viewBox="0 0 100 122"
      fill="none"
      style={{ filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.18))' }}
    >
      <ellipse cx="50" cy="119" rx="26" ry="5" fill="rgba(0,0,0,0.14)" />

      <BearBase smile="normal" brows={true}>
        {/* Kask / başlık — sert görünüm */}
        <path d="M22 38 Q24 16 50 13 Q76 16 78 38"
          fill="#4A6A8A" />
        {/* Kask kenar şeridi */}
        <rect x="22" y="36" width="56" height="7" rx="3" fill="#3A5470" />
        {/* Marigold rozet kaskte */}
        <circle cx="50" cy="22" r="7" fill="#F2B705" />
        <polygon points="50,17 51.8,22.5 57.5,22.5 52.9,25.8 54.7,31.3 50,28 45.3,31.3 47.1,25.8 42.5,22.5 48.2,22.5"
          fill="white" />

        {/* Sol kol — güçlü poz, hafif öne */}
        <ellipse cx="22" cy="98" rx="8" ry="14" fill={FUR}
          transform="rotate(15 22 98)" />
        <circle cx="18" cy="110" r="8" fill={FUR} />

        {/* Sağ kol — güçlü poz, hafif öne */}
        <ellipse cx="78" cy="98" rx="8" ry="14" fill={FUR}
          transform="rotate(-15 78 98)" />
        <circle cx="82" cy="110" r="8" fill={FUR} />

        {/* Göğüs rozeti */}
        <circle cx="50" cy="96" r="9" fill="#F2B705" />
        <circle cx="50" cy="96" r="6" fill="#FFD040" />
        <text x="46.5" y="100" fontSize="8" fill={DARK} fontFamily="sans-serif">★</text>
      </BearBase>
    </svg>
  )
}

// ── T4 Kahraman — Pelerinli, taçlı ──────────────────────
function T4Kahraman() {
  return (
    <svg width="175" height="200" viewBox="0 0 110 128"
      fill="none"
      style={{
        filter:
          'drop-shadow(0 0 14px rgba(242,183,5,0.35)) drop-shadow(0 12px 22px rgba(0,0,0,0.2))',
        transform: 'scale(1.04)',
      }}
    >
      <ellipse cx="55" cy="124" rx="28" ry="5.5" fill="rgba(0,0,0,0.16)" />

      {/* Pelerin (gövdenin arkasında) */}
      <path d="M30 92 Q18 105 22 122 L55 110 L88 122 Q92 105 80 92 Q55 100 30 92Z"
        fill="#F2B705" />
      <path d="M32 93 Q55 102 78 93" stroke="rgba(255,255,255,0.3)"
        strokeWidth="1.5" fill="none" />

      <g transform="translate(5, 0)">
        <BearBase furColor={FUR} eyeGlow={false} smile="big" brows={true}>
          {/* Taç */}
          <path d="M25 36 L30 22 L38 32 L50 18 L62 32 L70 22 L75 36"
            fill="#F2B705" strokeLinejoin="round" />
          <circle cx="50" cy="19" r="4" fill="white" />
          <circle cx="30" cy="22" r="3" fill="#FFD040" />
          <circle cx="70" cy="22" r="3" fill="#FFD040" />

          {/* Sol kol — açık, kahraman duruşu */}
          <ellipse cx="20" cy="96" rx="8" ry="14" fill={FUR}
            transform="rotate(20 20 96)" />
          <circle cx="15" cy="108" r="8" fill={FUR} />
          {/* Sağ kol */}
          <ellipse cx="80" cy="96" rx="8" ry="14" fill={FUR}
            transform="rotate(-20 80 96)" />
          <circle cx="85" cy="108" r="8" fill={FUR} />

          {/* Pelerin düğmesi */}
          <circle cx="50" cy="92" r="6" fill="#F2B705" />
          <circle cx="50" cy="92" r="3.5" fill="#FFD040" />
        </BearBase>
      </g>
    </svg>
  )
}

// ── T5 Efsane — Altın, taçlı, dönen hale ────────────────
function T5Efsane() {
  const GOLD_FUR = '#D4A040'

  return (
    <svg width="185" height="215" viewBox="0 0 120 135"
      fill="none"
      style={{
        filter:
          'drop-shadow(0 0 24px rgba(242,183,5,0.6)) drop-shadow(0 14px 28px rgba(0,0,0,0.22))',
        transform: 'scale(1.07)',
      }}
    >
      {/* Dönen dış hale */}
      <g className="character-halo"
        style={{ transformOrigin: '60px 62px' }}>
        <circle cx="60" cy="62" r="56"
          stroke="#F2B705" strokeWidth="2" strokeDasharray="7 5"
          fill="none" opacity="0.55" />
        {[0,60,120,180,240,300].map((deg, i) => {
          const rad = (deg * Math.PI) / 180
          const x = 60 + 56 * Math.cos(rad)
          const y = 62 + 56 * Math.sin(rad)
          return <circle key={i} cx={x} cy={y} r={3} fill="#F2B705" opacity="0.8" />
        })}
      </g>

      {/* Parıltı arka */}
      <circle cx="60" cy="62" r="50" fill="rgba(242,183,5,0.08)" />

      <ellipse cx="60" cy="131" rx="30" ry="6" fill="rgba(0,0,0,0.18)" />

      {/* Altın pelerin */}
      <path d="M38 98 Q24 112 28 130 L60 116 L92 130 Q96 112 82 98 Q60 108 38 98Z"
        fill="linear-gradient(#FFE04D,#9A6B00)" />
      <path
        d="M38 98 Q24 112 28 130 L60 116 L92 130 Q96 112 82 98 Q60 108 38 98Z"
        fill="#F2B705" opacity="0.9" />
      <path d="M40 99 Q60 110 80 99"
        stroke="rgba(255,255,255,0.35)" strokeWidth="1.8" fill="none" />

      <g transform="translate(10, 0)">
        <BearBase furColor={GOLD_FUR} eyeGlow={true} smile="big">
          {/* Büyük altın taç */}
          <path d="M23 36 L29 18 L38 30 L50 14 L62 30 L71 18 L77 36"
            fill="#F2B705" />
          {/* Taç mücevherleri */}
          <circle cx="50" cy="15" r="5" fill="white" />
          <circle cx="50" cy="15" r="3" fill="#AAE0FF" />
          <circle cx="29" cy="19" r="3.5" fill="#FFB0C0" />
          <circle cx="71" cy="19" r="3.5" fill="#B0FFB8" />
          {/* Taç kenar şeridi */}
          <rect x="22" y="34" width="56" height="5" rx="2.5" fill="#E0A500" />

          {/* Kollar — açık, zafer pozu */}
          <ellipse cx="18" cy="94" rx="9" ry="15" fill={GOLD_FUR}
            transform="rotate(25 18 94)" />
          <circle cx="12" cy="106" r="9" fill={GOLD_FUR} />
          {/* Enerji efekti sol el */}
          <circle cx="10" cy="107" r="5" fill="#FFE04D" opacity="0.8" />

          <ellipse cx="82" cy="94" rx="9" ry="15" fill={GOLD_FUR}
            transform="rotate(-25 82 94)" />
          <circle cx="88" cy="106" r="9" fill={GOLD_FUR} />
          {/* Enerji efekti sağ el */}
          <circle cx="90" cy="107" r="5" fill="#FFE04D" opacity="0.8" />

          {/* Merkez altın kristal */}
          <circle cx="50" cy="96" r="9" fill="#FFE04D" />
          <circle cx="50" cy="96" r="5.5" fill="white" opacity="0.9" />
          <circle cx="50" cy="96" r="3" fill="#F2B705" />

          {/* Parıltı yıldızları çevresinde */}
          <text x="14" y="80" fontSize="10" fill="#F2B705" opacity="0.9">✦</text>
          <text x="76" y="80" fontSize="10" fill="#F2B705" opacity="0.9">✦</text>
          <text x="44" y="16" fontSize="8"  fill="#F2B705" opacity="0.8">✦</text>
        </BearBase>
      </g>
    </svg>
  )
}
