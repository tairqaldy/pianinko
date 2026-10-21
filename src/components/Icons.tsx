import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };

const base = (size = 16): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
});

export const IconMusic = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

export const IconChevron = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const IconPlay = ({ size, ...p }: P) => (
  <svg {...base(size)} fill="currentColor" stroke="none" {...p}>
    <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" />
  </svg>
);

export const IconPause = ({ size, ...p }: P) => (
  <svg {...base(size)} fill="currentColor" stroke="none" {...p}>
    <rect x="6" y="4" width="4.5" height="16" rx="1.5" />
    <rect x="13.5" y="4" width="4.5" height="16" rx="1.5" />
  </svg>
);

export const IconRestart = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

export const IconPrompter = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <rect x="2" y="6" width="20" height="12" rx="3" />
    <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" />
  </svg>
);

export const IconSliders = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </svg>
);

export const IconClose = ({ size, ...p }: P) => (
  <svg {...base(size)} strokeWidth={2.2} {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const IconSearch = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const IconHelp = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" />
  </svg>
);

export const IconEdit = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
  </svg>
);

export const IconTrash = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </svg>
);

export const IconUpload = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
  </svg>
);

export const IconSparkle = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
  </svg>
);

export const IconMinus = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M5 12h14" />
  </svg>
);

export const IconPlus = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
