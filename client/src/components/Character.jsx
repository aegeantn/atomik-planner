// Character.jsx — Gerçek Dudu görseli üzerine tier aksesuar katmanları
// Temel: /dudu.jpg (statik JPEG)
// Tier farkı: CSS filtre + mutlak konumlandırılmış SVG/HTML aksesuarlar

// Dudu'nun kürk rengi (aksesuarların görünmez kenarları için)
const FUR = '#C8966A'

export default function Character({ tier = 1 }) {
  return (
    // character-float animasyonu Dashboard'dan geliyor
    <div style={{ position: 'relative', width: 148, height: 158, flexShrink: 0 }}>

      {/* T5: Dönen hale (resmin arkasında) */}
      {tier === 5 && <HaloRing />}

      {/* T4: Pelerin (resmin arkasında) */}
      {tier >= 4 && <Cape />}

      {/* Dudu görseli */}
      <img
        src="/dudu.jpg"
        alt="Dudu"
        className={tier === 1 ? 'bear-sway' : ''}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          mixBlendMode: 'multiply',   // beyaz arka planı kartın rengiyle eritir
          display: 'block',
          position: 'relative',
          zIndex: 2,
          // Tier'a göre CSS filtre efekti
          filter:
            tier === 5 ? 'sepia(0.35) saturate(1.7) hue-rotate(-8deg) brightness(1.08)' :
            tier === 4 ? 'brightness(1.06) saturate(1.2)' :
            'none',
        }}
      />

      {/* T1: El sallayan pençe (sağ kol üstüne) */}
      {tier === 1 && <WavePaw />}

      {/* T2+: Marigold kafa bandı */}
      {tier === 2 && <Bandana />}

      {/* T3: Yıldızlı kask bandı + göğüs rozeti */}
      {tier === 3 && <KaskBand />}
      {tier === 3 && <ChestBadge />}

      {/* T4+: Taç */}
      {tier >= 4 && <Crown big={tier === 5} />}

      {/* T5: Parıltı yıldızları */}
      {tier === 5 && <Sparkles />}
    </div>
  )
}

// ── T1: El sallayan pençe ────────────────────────────────────
// Dudu'nun sağ kolunun üstüne konumlanır (resmin sağ alt bölgesi)
function WavePaw() {
  return (
    <svg
      width="36" height="36"
      viewBox="0 0 36 36"
      style={{ position: 'absolute', right: '-4px', top: '60%', zIndex: 3 }}
    >
      {/* Pençe pedi */}
      <circle cx="18" cy="22" r="12" fill={FUR} />
      {/* Parmak uçları */}
      <circle cx="9"  cy="13" r="6"  fill={FUR} />
      <circle cx="18" cy="10" r="6"  fill={FUR} />
      <circle cx="27" cy="13" r="6"  fill={FUR} />
      {/* Pençe alt çizgi */}
      <ellipse cx="18" cy="24" rx="7" ry="4" fill="rgba(0,0,0,0.07)" />

      {/* El sallama animasyonu — pivot pençenin alt ortasında */}
      <animateTransform
        attributeName="transform"
        type="rotate"
        values="0 18 34; -40 18 34; 15 18 34; -40 18 34; 0 18 34"
        dur="1s"
        repeatCount="indefinite"
      />
    </svg>
  )
}

// ── T2: Marigold kafa bandı ──────────────────────────────────
// Dudu'nun alnına gelecek şekilde konumlandırılır
function Bandana() {
  return (
    <svg
      width="110" height="22"
      viewBox="0 0 110 22"
      style={{ position: 'absolute', left: '50%', top: '22%', transform: 'translateX(-50%)', zIndex: 3 }}
    >
      {/* Bandana şeridi */}
      <rect x="0" y="4" width="110" height="14" rx="7" fill="#F2B705" />
      {/* Bandana highlight */}
      <rect x="4" y="5" width="102" height="5" rx="3" fill="rgba(255,255,255,0.25)" />
      {/* Sağ düğüm */}
      <ellipse cx="96" cy="11" rx="12" ry="9" fill="#E0A500" />
      <ellipse cx="96" cy="11" rx="7"  ry="5"  fill="#F2B705" />
    </svg>
  )
}

// ── T3: Kask bandı (yıldızlı) ───────────────────────────────
function KaskBand() {
  return (
    <svg
      width="120" height="26"
      viewBox="0 0 120 26"
      style={{ position: 'absolute', left: '50%', top: '19%', transform: 'translateX(-50%)', zIndex: 3 }}
    >
      {/* Metal şerit */}
      <rect x="0" y="5" width="120" height="16" rx="8" fill="#4A6A8A" />
      <rect x="2" y="6" width="116" height="6"  rx="4" fill="rgba(255,255,255,0.2)" />
      {/* Orta yıldız */}
      <circle cx="60" cy="13" r="10" fill="#F2B705" />
      <polygon
        points="60,6 62,11 68,11 63,15 65,21 60,17 55,21 57,15 52,11 58,11"
        fill="white"
      />
    </svg>
  )
}

// ── T3: Göğüs rozeti ─────────────────────────────────────────
function ChestBadge() {
  return (
    <svg
      width="28" height="28"
      viewBox="0 0 28 28"
      style={{ position: 'absolute', left: '50%', top: '67%', transform: 'translateX(-50%)', zIndex: 3 }}
    >
      <circle cx="14" cy="14" r="13" fill="#F2B705" />
      <circle cx="14" cy="14" r="9"  fill="#FFD040" />
      <polygon
        points="14,7 15.8,12.5 21.5,12.5 16.9,15.8 18.7,21.3 14,18 9.3,21.3 11.1,15.8 6.5,12.5 12.2,12.5"
        fill="white"
      />
    </svg>
  )
}

// ── T4+: Pelerin ─────────────────────────────────────────────
// Resmin arkasında (zIndex 1)
function Cape() {
  return (
    <svg
      width="148" height="90"
      viewBox="0 0 148 90"
      style={{ position: 'absolute', bottom: 0, left: 0, zIndex: 1 }}
    >
      <path
        d="M30 10 Q20 50 25 88 L74 72 L123 88 Q128 50 118 10 Q74 28 30 10Z"
        fill="#F2B705"
        opacity="0.92"
      />
      <path
        d="M32 12 Q74 30 116 12"
        stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none"
      />
    </svg>
  )
}

// ── T4+: Taç ─────────────────────────────────────────────────
function Crown({ big = false }) {
  const w = big ? 88 : 72
  const h = big ? 38 : 30
  return (
    <svg
      width={w} height={h}
      viewBox="0 0 88 38"
      style={{
        position: 'absolute',
        left: '50%',
        top: big ? '-14px' : '-10px',
        transform: 'translateX(-50%)',
        zIndex: 4,
      }}
    >
      {/* Taç gövde */}
      <path d="M4 36 L10 12 L24 26 L44 4 L64 26 L78 12 L84 36 Z" fill="#F2B705" />
      {/* Alt kenar şeridi */}
      <rect x="4" y="32" width="80" height="7" rx="3.5" fill="#D4900A" />
      {/* Mücevherler */}
      <circle cx="44" cy="7"  r={big ? 6 : 5}  fill="white" />
      <circle cx="44" cy="7"  r={big ? 3 : 2.5} fill="#AAE0FF" />
      {big && <>
        <circle cx="16" cy="22" r="4" fill="#FFB0C0" />
        <circle cx="72" cy="22" r="4" fill="#B0FFB8" />
      </>}
      {/* Highlight */}
      <path d="M12 34 Q44 28 76 34" stroke="rgba(255,255,255,0.25)" strokeWidth="2" fill="none" />
    </svg>
  )
}

// ── T5: Dönen hale ───────────────────────────────────────────
function HaloRing() {
  const cx = 74, cy = 79, r = 68
  const dots = [0, 45, 90, 135, 180, 225, 270, 315]
  return (
    <svg
      width="148" height="158"
      viewBox="0 0 148 158"
      style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}
    >
      <g className="character-halo" style={{ transformOrigin: `${cx}px ${cy}px` }}>
        <circle cx={cx} cy={cy} r={r}
          stroke="#F2B705" strokeWidth="1.8" strokeDasharray="6 5"
          fill="none" opacity="0.5"
        />
        {dots.map((deg, i) => {
          const rad = (deg * Math.PI) / 180
          const x = cx + r * Math.cos(rad)
          const y = cy + r * Math.sin(rad)
          return (
            <circle key={i} cx={x} cy={y}
              r={i % 2 === 0 ? 3.5 : 2}
              fill="#F2B705"
              opacity={i % 2 === 0 ? 0.85 : 0.5}
            />
          )
        })}
      </g>
    </svg>
  )
}

// ── T5: Parıltı yıldızları ───────────────────────────────────
function Sparkles() {
  return (
    <svg
      width="148" height="158"
      viewBox="0 0 148 158"
      style={{ position: 'absolute', top: 0, left: 0, zIndex: 5, pointerEvents: 'none' }}
    >
      {[
        { x: 18, y: 38, s: 10, delay: '0s'    },
        { x: 128, y: 45, s: 8,  delay: '0.4s' },
        { x: 12,  y: 95, s: 7,  delay: '0.8s' },
        { x: 135, y: 90, s: 9,  delay: '0.2s' },
        { x: 74,  y: 18, s: 8,  delay: '0.6s' },
      ].map((sp, i) => (
        <text key={i} x={sp.x} y={sp.y} fontSize={sp.s}
          fill="#F2B705" textAnchor="middle"
          style={{ animation: `aiPulse 1.6s ease-in-out ${sp.delay} infinite` }}
        >
          ✦
        </text>
      ))}
    </svg>
  )
}
