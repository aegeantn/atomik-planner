// Logo.jsx — Atom yörünge logosu + "Atomik Planner" wordmark
// SVG: merkez çekirdek (ink) + marigold yörünge halkası + elektron noktası
// Favicon ile aynı motif; header'da ~24px yükseklikte kullanılır.

export default function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
      {/* Atom SVG */}
      <svg
        width="26"
        height="26"
        viewBox="0 0 26 26"
        fill="none"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        {/* Yörünge halkası */}
        <ellipse
          cx="13"
          cy="13"
          rx="11"
          ry="5"
          stroke="var(--color-accent)"
          strokeWidth="2"
          transform="rotate(-35 13 13)"
        />
        {/* Çekirdek */}
        <circle cx="13" cy="13" r="3" fill="var(--color-ink)" />
        {/* Elektron */}
        <circle cx="21" cy="7.5" r="2" fill="var(--color-accent)" />
      </svg>

      {/* Wordmark */}
      <span aria-label="Atomik Planner" style={{ display: 'flex', alignItems: 'baseline', gap: '1px' }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '0.9375rem',
            letterSpacing: '-0.02em',
            color: 'var(--color-ink)',
          }}
        >
          Atomik
        </span>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '0.9375rem',
            letterSpacing: '-0.02em',
            color: 'var(--color-accent-ink)',
          }}
        >
          &nbsp;Planner
        </span>
      </span>
    </div>
  )
}
