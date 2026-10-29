import type { ComponentProps } from "react";

type IconProps = ComponentProps<"svg">;

function iconProps(props: IconProps) {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M3.5 10.4 12 3.5l8.5 6.9" />
      <path d="M5.5 9.2V20a.8.8 0 0 0 .8.8h4.1v-6.2h3.2v6.2h4.1a.8.8 0 0 0 .8-.8V9.2" />
    </svg>
  );
}

export function HomesIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M3.5 20.5V9.8L10 5.5v15" />
      <path d="M10 10.2h7.2a1 1 0 0 1 1 1v9.3" />
      <path d="M13.8 20.5v-4.2h2.4v4.2" />
      <path d="M6.3 9.5h1.6M6.3 12.5h1.6M6.3 15.5h1.6" />
      <path d="M18.2 20.5H21" />
      <path d="M3.5 20.5H6" />
    </svg>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M12 20.1s-7.6-4.6-7.6-10A4.1 4.1 0 0 1 12 7.4a4.1 4.1 0 0 1 7.6 2.7c0 5.4-7.6 10-7.6 10Z" />
    </svg>
  );
}

export function BudgetIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M3.8 8.2A2.2 2.2 0 0 1 6 6h11.2A2.2 2.2 0 0 1 19.4 8v1" />
      <path d="M3.8 8.9h14.9a1.7 1.7 0 0 1 1.7 1.7v7.5a1.7 1.7 0 0 1-1.7 1.7H5.5a1.7 1.7 0 0 1-1.7-1.7Z" />
      <path d="M16.1 14.3h.1" />
      <path d="M3.8 11.2V7.4a2 2 0 0 1 1.4-1.9l9.5-2.4" />
    </svg>
  );
}

export function MoreIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="5.5" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="m15.5 15.5 4.2 4.2" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M4.5 12h15" />
      <path d="m13.6 6.1 5.9 5.9-5.9 5.9" />
    </svg>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M7 17 17 7" />
      <path d="M8.2 7H17v8.8" />
    </svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M19.5 12h-15" />
      <path d="m10.4 6.1-5.9 5.9 5.9 5.9" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="m5.5 9 6.5 6.5L18.5 9" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="m9 5.5 6.5 6.5L9 18.5" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="m5 12.5 4.2 4.2L19 7" />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="m12 3.7 2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8Z" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <rect x="3.8" y="5.2" width="16.4" height="15" rx="2.2" />
      <path d="M3.8 9.6h16.4M8 3.5v3.4M16 3.5v3.4" />
      <path d="M7.8 13.2h.1M12 13.2h.1M16.2 13.2h.1M7.8 16.8h.1M12 16.8h.1" />
    </svg>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M19 10.3c0 5-7 10.2-7 10.2S5 15.3 5 10.3a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="10.2" r="2.4" />
    </svg>
  );
}

export function ShareIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="17.5" cy="5.8" r="2.5" />
      <circle cx="6.5" cy="12" r="2.5" />
      <circle cx="17.5" cy="18.2" r="2.5" />
      <path d="m8.7 10.8 6.6-3.7M8.7 13.2l6.6 3.7" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.6v4.8l3.2 1.9" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M12 3.2 19 6v5.5c0 4.3-3.1 7.5-7 9.3-3.9-1.8-7-5-7-9.3V6Z" />
      <path d="m9.2 12 1.9 1.9 3.8-3.8" />
    </svg>
  );
}

export function DocumentIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M6 3.5h8l4 4v13H6Z" />
      <path d="M14 3.5v4h4M9 12h6M9 15.5h6" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M4.5 7h15" />
      <path d="M9 7V4.8h6V7" />
      <path d="M6.6 7l.7 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.7-12" />
      <path d="M10.2 10.5v6M13.8 10.5v6" />
    </svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M4 7h8.2M17.4 7H20M4 17h2.6M11.8 17H20" />
      <circle cx="15" cy="7" r="2.2" />
      <circle cx="9" cy="17" r="2.2" />
    </svg>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M12 3.5c.6 4.7 3.8 7.9 8.5 8.5-4.7.6-7.9 3.8-8.5 8.5-.6-4.7-3.8-7.9-8.5-8.5 4.7-.6 7.9-3.8 8.5-8.5Z" />
    </svg>
  );
}

