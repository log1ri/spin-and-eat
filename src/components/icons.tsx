import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }

const base = (size: number, rest: SVGProps<SVGSVGElement>) => ({
  'aria-hidden': true as const,
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...rest,
})

export const ListIcon = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <circle cx="3.5" cy="6" r="1" />
    <circle cx="3.5" cy="12" r="1" />
    <circle cx="3.5" cy="18" r="1" />
  </svg>
)
export const ChevronLeft = ({ size = 18, ...p }: P) => (
  <svg {...base(size, { strokeWidth: 2.2, ...p })}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
)
export const ChevronRight = ({ size = 18, ...p }: P) => (
  <svg {...base(size, { strokeWidth: 2.2, ...p })}>
    <path d="M9 6l6 6-6 6" />
  </svg>
)
export const ShuffleIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M16 3h5v5" />
    <path d="M4 20 21 3" />
    <path d="M21 16v5h-5" />
    <path d="m15 15 6 6" />
    <path d="M4 4l5 5" />
  </svg>
)
export const PlayIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M7 4.5v15l12-7.5z" />
  </svg>
)
export const NeedleIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size, p)}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M12 3a9 9 0 0 1 9 9" />
  </svg>
)
export const CloseIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)
export const SearchIcon = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)
export const TrashIcon = ({ size = 15, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </svg>
)
export const PlusIcon = ({ size = 20, ...p }: P) => (
  <svg {...base(size, { strokeWidth: 2.4, ...p })}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)
export const SoundOnIcon = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M11 5 6 9H3v6h3l5 4z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
  </svg>
)
export const SoundOffIcon = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M11 5 6 9H3v6h3l5 4z" />
    <path d="m16 9 5 6M21 9l-5 6" />
  </svg>
)
export const ChevronDown = ({ size = 14, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)
export const CheckIcon = ({ size = 14, ...p }: P) => (
  <svg {...base(size, { strokeWidth: 2.4, ...p })}>
    <path d="M5 12.5 10 17l9-10" />
  </svg>
)
export const ArrowDown = ({ size = 20, ...p }: P) => (
  <svg {...base(size, { strokeWidth: 1.6, ...p })}>
    <path d="M12 4v16M5 13l7 7 7-7" />
  </svg>
)
export const ArrowUp = ({ size = 20, ...p }: P) => (
  <svg {...base(size, { strokeWidth: 1.6, ...p })}>
    <path d="M12 20V4M5 11l7-7 7 7" />
  </svg>
)
/** Skip to next / previous album: rounded solid triangle + bar */
export const SkipNext = ({ size = 20, ...p }: P) => (
  <svg {...base(size, { fill: 'currentColor', strokeWidth: 2.4, ...p })}>
    <path d="M6 6.5 14 12 6 17.5Z" />
    <rect x="16.6" y="5.6" width="2.2" height="12.8" rx="1.1" strokeWidth={1.2} />
  </svg>
)
export const SkipBack = ({ size = 20, ...p }: P) => (
  <svg {...base(size, { fill: 'currentColor', strokeWidth: 2.4, ...p })}>
    <path d="M18 6.5 10 12l8 5.5Z" />
    <rect x="5.2" y="5.6" width="2.2" height="12.8" rx="1.1" strokeWidth={1.2} />
  </svg>
)
