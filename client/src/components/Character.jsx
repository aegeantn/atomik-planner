// Character.jsx — Dudu (şeffaf PNG) üzerine tier aksesuar katmanları
// Temel: /dudu.png (arka plan kaldırılmış, 194×259px)
// Tier farkı: CSS filtre + mutlak konumlu SVG aksesuarlar

export default function Character({ tier = 1 }) {
  return (
    <div style={{ position: 'relative', width: 130, height: 174, flexShrink: 0 }}>

      {/* T5: Dönen hale (resmin arkasında) */}
      {tier === 5 && <HaloRing />}

      {/* T4+: Pelerin (resmin arkasında) */}
      {tier >= 4 && <Cape />}

      {/* Dudu — şeffaf PNG, herhangi bir arka plana oturur */}
      <img
        src="/dudu.png"
        alt="Dudu"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
          position: 'relative',
          zIndex: 2,
          filter:
            tier === 5 ? 'sepia(0.3) saturate(1.7) hue-rotate(-8deg) brightness(1.1)' :
            tier === 4 ? 'brightness(1.06) saturate(1.15)' :
            'none',
        }}
      />

      {/* T2: Marigold kafa bandı */}
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

// Dudu 194×259 orijinal → 130×174 görünüm
// Kafanın üstü: ~y=10, kafa merkezi: ~y=52, alın: ~y=32
// Göğüs bölgesi: ~y=120
// Taç için: top=-14px

function Bandana() {
  return (
    <svg width="100" height="20" viewBox="0 0 100 20"
      style={{ position: 'absolute', left: '50%', top: '19%', transform: 'translateX(-50%)', zIndex: 3 }}>
      <rect x="0" y="3" width="100" height="13" rx="6.5" fill="#F2B705" />
      <rect x="3" y="4" width="94" height="5" rx="3" fill="rgba(255,255,255,0.25)" />
      <ellipse cx="88" cy="9.5" rx="11" ry="8" fill="#E0A500" />
      <ellipse cx="88" cy="9.5" rx="6"  ry="4.5" fill="#F2B705" />
    </svg>
  )
}

function KaskBand() {
  return (
    <svg width="112" height="24" viewBox="0 0 112 24"
      style={{ position: 'absolute', left: '50%', top: '16%', transform: 'translateX(-50%)', zIndex: 3 }}>
      <rect x="0" y="4" width="112" height="16" rx="8" fill="#4A6A8A" />
      <rect x="2" y="5"  width="108" height="6"  rx="4" fill="rgba(255,255,255,0.2)" />
      <circle cx="56" cy="12" r="10" fill="#F2B705" />
      <polygon points="56,6 57.8,10.5 63,10.5 58.9,13.5 60.5,18.5 56,15.5 51.5,18.5 53.1,13.5 49,10.5 54.2,10.5" fill="white" />
    </svg>
  )
}

function ChestBadge() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26"
      style={{ position: 'absolute', left: '50%', top: '65%', transform: 'translateX(-50%)', zIndex: 3 }}>
      <circle cx="13" cy="13" r="12" fill="#F2B705" />
      <circle cx="13" cy="13" r="8"  fill="#FFD040" />
      <polygon points="13,7 14.6,11.5 19.5,11.5 15.4,14.3 17,18.8 13,16 9,18.8 10.6,14.3 6.5,11.5 11.4,11.5" fill="white" />
    </svg>
  )
}

function Cape() {
  return (
    <svg width="130" height="80" viewBox="0 0 130 80"
      style={{ position: 'absolute', bottom: 0, left: 0, zIndex: 1 }}>
      <path d="M28 8 Q16 44 20 78 L65 62 L110 78 Q114 44 102 8 Q65 26 28 8Z" fill="#F2B705" opacity="0.9" />
      <path d="M30 10 Q65 28 100 10" stroke="rgba(255,255,255,0.28)" strokeWidth="1.8" fill="none" />
    </svg>
  )
}

function Crown({ big = false }) {
  return (
    <svg width={big ? 82 : 66} height={big ? 36 : 28} viewBox="0 0 82 36"
      style={{ position: 'absolute', left: '50%', top: big ? '-14px' : '-10px', transform: 'translateX(-50%)', zIndex: 4 }}>
      <path d="M4 34 L10 11 L23 24 L41 3 L59 24 L72 11 L78 34 Z" fill="#F2B705" />
      <rect x="4" y="30" width="74" height="6" rx="3" fill="#D4900A" />
      <circle cx="41" cy="6"  r={big ? 6 : 5}  fill="white" />
      <circle cx="41" cy="6"  r={big ? 3 : 2.5} fill="#AAE0FF" />
      {big && <>
        <circle cx="14" cy="21" r="4" fill="#FFB0C0" />
        <circle cx="68" cy="21" r="4" fill="#B0FFB8" />
      </>}
    </svg>
  )
}

function HaloRing() {
  const cx = 65, cy = 87, r = 62
  return (
    <svg width="130" height="174" viewBox="0 0 130 174"
      style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
      <g className="character-halo" style={{ transformOrigin: `${cx}px ${cy}px` }}>
        <circle cx={cx} cy={cy} r={r} stroke="#F2B705" strokeWidth="1.8" strokeDasharray="6 5" fill="none" opacity="0.5" />
        {[0,45,90,135,180,225,270,315].map((deg, i) => {
          const rad = deg * Math.PI / 180
          return <circle key={i} cx={cx + r*Math.cos(rad)} cy={cy + r*Math.sin(rad)}
            r={i%2===0 ? 3.5 : 2} fill="#F2B705" opacity={i%2===0 ? 0.85 : 0.5} />
        })}
      </g>
    </svg>
  )
}

function Sparkles() {
  const stars = [
    { x: 10, y: 35, s: 10, d: '0s'   },
    { x: 118,y: 40, s: 8,  d: '0.4s' },
    { x: 8,  y: 95, s: 7,  d: '0.8s' },
    { x: 120,y: 90, s: 9,  d: '0.2s' },
    { x: 65, y: 12, s: 8,  d: '0.6s' },
  ]
  return (
    <svg width="130" height="174" viewBox="0 0 130 174"
      style={{ position: 'absolute', top: 0, left: 0, zIndex: 5, pointerEvents: 'none' }}>
      {stars.map((s, i) => (
        <text key={i} x={s.x} y={s.y} fontSize={s.s} fill="#F2B705" textAnchor="middle"
          style={{ animation: `aiPulse 1.6s ease-in-out ${s.d} infinite` }}>✦</text>
      ))}
    </svg>
  )
}
