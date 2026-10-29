"use client";

import { useI18n } from "../lib/i18n";

export function HouseIllustration({ className }: { className?: string }) {
  const { t } = useI18n();

  return (
    <svg
      viewBox="0 0 420 260"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={t("common.illustrationAria")}
      className={className}
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#afc3d6" />
          <stop offset="60%" stopColor="#d9ddd8" />
          <stop offset="100%" stopColor="#efe7d8" />
        </linearGradient>
        <linearGradient id="wall" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f8f3e9" />
          <stop offset="100%" stopColor="#e4dac8" />
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5d6b59" />
          <stop offset="55%" stopColor="#3c4a38" />
          <stop offset="100%" stopColor="#26311f" />
        </linearGradient>
        <linearGradient id="pool" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b7cbc9" />
          <stop offset="100%" stopColor="#8aa3a0" />
        </linearGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6f7d63" />
          <stop offset="100%" stopColor="#4c5a43" />
        </linearGradient>
        <radialGradient id="sunGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#f6e6c3" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#f6e6c3" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="420" height="260" fill="url(#sky)" />
      <circle cx="318" cy="58" r="62" fill="url(#sunGlow)" />
      <circle cx="318" cy="58" r="22" fill="#f4e4c2" opacity="0.85" />

      {/* distant greenery */}
      <path
        d="M0 132c35-16 62-8 91-19 35-13 69-9 101 1 38 12 58-3 90 2 41 6 74 0 138-13v41H0Z"
        fill="#8a9680"
        opacity="0.55"
      />
      <path
        d="M0 146c45-9 72-3 108-12 42-11 84 4 122 5 40 1 66-12 104-6 30 5 58 3 86-2v29H0Z"
        fill="#6f7d63"
        opacity="0.6"
      />

      {/* back volume */}
      <rect x="58" y="96" width="126" height="91" fill="#ddd2bf" />
      <rect x="58" y="96" width="126" height="4" fill="#3a4936" opacity="0.75" />
      <rect x="72" y="112" width="42" height="44" fill="url(#glass)" opacity="0.9" />
      <path d="M72 112h42v44H72Z" fill="none" stroke="#d9cfbd" strokeWidth="2" opacity="0.65" />
      <path d="M93 112v44" stroke="#d9cfbd" strokeWidth="1.4" opacity="0.55" />
      <path d="M72 134h42" stroke="#d9cfbd" strokeWidth="1.4" opacity="0.55" />

      {/* main volume */}
      <rect x="145" y="79" width="170" height="108" fill="url(#wall)" />
      <rect x="141" y="75" width="178" height="5" rx="1" fill="#3a4936" />

      {/* deep eave */}
      <rect x="182" y="98" width="86" height="74" fill="url(#glass)" />
      <rect x="182" y="98" width="86" height="74" fill="none" stroke="#efe7d8" strokeWidth="2.4" opacity="0.8" />
      <path d="M210.6 98v74M239.3 98v74" stroke="#d7cbb7" strokeWidth="1.8" opacity="0.7" />
      <path d="M182 135h86" stroke="#d7cbb7" strokeWidth="1.8" opacity="0.6" />
      <path d="M186 102 220 168h-14l-24-47Z" fill="#f2eadb" opacity="0.12" />
      <path d="M226 102 258 168h-9l-27-53Z" fill="#f2eadb" opacity="0.09" />

      {/* warm interior glow */}
      <rect x="270" y="108" width="30" height="52" fill="#d9c6a3" opacity="0.55" />
      <rect x="270" y="108" width="30" height="52" fill="none" stroke="#efe7d8" strokeWidth="2" opacity="0.7" />
      <path d="M270 134h30" stroke="#efe7d8" strokeWidth="1.4" opacity="0.6" />

      {/* front door and slatted screen */}
      <rect x="309" y="120" width="34" height="67" fill="#8c7554" />
      <rect x="309" y="120" width="34" height="67" fill="none" stroke="#5f513c" strokeWidth="1.5" opacity="0.5" />
      <path d="M316 120v67M323 120v67M330 120v67M337 120v67" stroke="#6f5d44" strokeWidth="1" opacity="0.55" />
      <rect x="341" y="120" width="16" height="67" fill="#374534" opacity="0.9" />
      <path d="M345 120v67M349 120v67M353 120v67" stroke="#61705a" strokeWidth="1" opacity="0.5" />

      {/* paving */}
      <rect x="0" y="187" width="420" height="73" fill="url(#ground)" />
      <rect x="0" y="187" width="420" height="5" fill="#c9bea9" opacity="0.7" />
      <path d="M0 207h420M0 229h420M0 249h420" stroke="#3f4b37" strokeWidth="1" opacity="0.35" />
      <path d="M60 187v73M120 187v73M180 187v73M240 187v73M300 187v73M360 187v73" stroke="#3f4b37" strokeWidth="1" opacity="0.2" />

      {/* pool */}
      <path d="M238 204h162c9 0 16 7 16 16v24c0 9-7 16-16 16H238c-9 0-16-7-16-16v-24c0-9 7-16 16-16Z" fill="url(#pool)" />
      <path d="M238 204h162c9 0 16 7 16 16v24c0 9-7 16-16 16H238c-9 0-16-7-16-16v-24c0-9 7-16 16-16Z" fill="none" stroke="#efe7d8" strokeWidth="2.5" opacity="0.85" />
      <path d="M228 224c22 7 36-6 58 0s35 7 57 0 33 5 52 0" fill="none" stroke="#e7f0ec" strokeWidth="1.6" opacity="0.55" />
      <path d="M228 236c22 7 36-6 58 0s35 7 57 0 33 5 52 0" fill="none" stroke="#e7f0ec" strokeWidth="1.4" opacity="0.35" />

      {/* stepping stones */}
      <path d="M170 214h26v10h-26Z M150 232h28v11h-28Z M171 250h26v10h-26Z" fill="#cfc3ae" opacity="0.7" />

      {/* palms */}
      <g fill="#374534">
        <path d="M45 190c1-20 2-38 6-53 2-8 6-13 10-17l2 3c-5 7-6 13-7 18-2 14-2 32-3 49Z" />
        <path d="M55 126c-11-5-19-13-24-23 11 3 19 10 26 18Z" />
        <path d="M57 125c1-12 7-22 16-28 1 11-4 21-10 29Z" />
        <path d="M56 129c12-4 23-3 33 3-9 7-21 8-30 3Z" />
        <path d="M53 128c-12 2-21 8-27 17 11 2 21-3 28-10Z" />
        <path d="M58 132c9 6 15 14 17 24-11-2-18-11-20-20Z" />
      </g>
      <g fill="#43523c">
        <path d="M390 188c-1-17-1-34-5-48-1-7-4-12-8-16l-2 3c4 6 5 11 6 16 2 13 2 30 3 45Z" />
        <path d="M381 133c9-5 16-12 20-21-9 3-16 9-22 16Z" />
        <path d="M379 132c-1-10-6-19-14-24 0 10 4 18 9 26Z" />
        <path d="M380 136c-10-3-19-2-27 3 7 6 17 6 25 2Z" />
        <path d="M383 135c10 2 17 7 22 15-9 2-17-2-23-8Z" />
      </g>

      {/* foreground planting */}
      <path d="M0 244c23-11 47-13 71-5 20 7 39 8 57 2 22-7 44-4 64 6v13H0Z" fill="#3a4936" opacity="0.9" />
      <path d="M0 252c30-7 59-7 89 0 28 6 56 4 84-4 22-7 42-6 61 2v10H0Z" fill="#2c3727" opacity="0.85" />
      <g stroke="#7f8c72" strokeWidth="1.4" opacity="0.7">
        <path d="M22 246c4-10 10-16 18-20M38 248c2-9 6-16 12-22M54 247c4-9 9-14 16-18M370 246c-3-9-8-16-15-21M386 248c-2-9-5-16-11-22" fill="none" />
      </g>

      {/* soft light bloom */}
      <rect width="420" height="260" fill="#f8f0df" opacity="0.06" />
    </svg>
  );
}
