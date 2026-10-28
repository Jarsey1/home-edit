"use client";

import { useState } from "react";
import { type Home } from "../../lib/homes";
import { BackButton } from "../back-button";
import {
  CheckIcon,
  ClockIcon,
  MapPinIcon,
  ShieldIcon,
  SparkleIcon,
} from "../icons";

type TabId = "overview" | "schools" | "convenience" | "safety";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "schools", label: "Schools" },
  { id: "convenience", label: "Errands" },
  { id: "safety", label: "Safety" },
];

const SCHOOLS = [
  { level: "Elementary", name: "Palm Grove Elementary", minutes: 5, score: 9 },
  { level: "Middle", name: "Riverside Middle School", minutes: 8, score: 8 },
  { level: "High", name: "Coral Bay High School", minutes: 10, score: 8 },
];

const ERRANDS = [
  { label: "Grocery", detail: "Fresh Market", minutes: 3 },
  { label: "Highway", detail: "I-95 on-ramp", minutes: 5 },
  { label: "Pharmacy", detail: "Palm Grove Pharmacy", minutes: 4 },
  { label: "Coffee", detail: "The Daily Grind", minutes: 2 },
  { label: "Airport", detail: "MIA", minutes: 18 },
];

const SAFETY_ITEMS = [
  {
    title: "Flood Zone X",
    detail:
      "Minimal flood risk. Not in a high-risk flood area according to FEMA maps.",
  },
  {
    title: "Not in an evacuation zone",
    detail: "The property sits outside local evacuation zones.",
  },
  {
    title: "Quiet residential street",
    detail: "Low traffic, with a neighborhood watch and well-lit sidewalks.",
  },
];

export function NeighborhoodScreen({
  home,
  onBack,
}: {
  home: Home;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<TabId>("overview");

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-start gap-3 px-6 pt-8">
        <BackButton onClick={onBack} label="Go back" />
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
            The area
          </p>
          <h1 className="mt-1 font-serif text-[31px] leading-none tracking-[-0.02em] text-ink">
            Neighborhood
          </h1>
        </div>
      </header>

      <div className="px-6 pb-9">
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
          <MapPinIcon className="h-3.5 w-3.5 text-olive/70" />
          {home.address} <span className="text-muted/50">·</span> {home.city}
        </p>

        <MapPreview />

        <div className="mt-5 flex rounded-full border border-line bg-parchment p-1">
          {TABS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setTab(option.id)}
              className={[
                "flex-1 rounded-full px-1 py-2 text-[10px] transition-colors",
                tab === option.id
                  ? "bg-olive font-medium text-cream shadow-sm"
                  : "text-muted hover:text-ink",
              ].join(" ")}
            >
              {option.label}
            </button>
          ))}
        </div>

        {tab === "overview" && <Overview home={home} />}
        {tab === "schools" && <Schools />}
        {tab === "convenience" && <Errands />}
        {tab === "safety" && <Safety />}
      </div>
    </div>
  );
}

function MapPreview() {
  return (
    <div className="relative mt-4 h-[164px] overflow-hidden rounded-[24px] border border-line bg-[#e9e4d8]">
      <svg
        viewBox="0 0 390 164"
        className="h-full w-full"
        role="img"
        aria-label="Map of the neighborhood showing streets, parks and nearby water"
      >
        <rect width="390" height="164" fill="#e6e0d3" />

        {/* water */}
        <path
          d="M300 0h90v64c-16 8-29-4-45 0-18 4-27 17-45 12V0Z"
          fill="#c6d7d4"
        />
        <path
          d="M300 0h90v64c-16 8-29-4-45 0-18 4-27 17-45 12V0Z"
          fill="none"
          stroke="#aec4c0"
          strokeWidth="1.4"
          opacity="0.7"
        />

        {/* parks */}
        <rect x="18" y="18" width="78" height="46" rx="8" fill="#d3dfc8" />
        <rect x="218" y="98" width="72" height="48" rx="8" fill="#d3dfc8" />
        <circle cx="57" cy="41" r="11" fill="#b9ccab" />
        <circle cx="254" cy="122" r="9" fill="#b9ccab" />

        {/* blocks */}
        {[
          [116, 16, 54, 30],
          [116, 58, 54, 24],
          [184, 16, 46, 30],
          [184, 58, 46, 24],
          [28, 84, 68, 26],
          [28, 120, 68, 26],
          [112, 96, 58, 50],
          [186, 96, 22, 50],
          [302, 92, 64, 54],
          [28, 18, 78, 46],
        ].map(([x, y, width, height], index) => (
          <rect
            key={index}
            x={x}
            y={y}
            width={width}
            height={height}
            rx="5"
            fill="#f5f0e5"
            stroke="#ded4c3"
            strokeWidth="1"
          />
        ))}

        {/* roads */}
        <g stroke="#dcd2c1" strokeWidth="13" strokeLinecap="round">
          <path d="M0 78h390" />
          <path d="M104 0v164" />
          <path d="M288 0v164" />
        </g>
        <g stroke="#fbf8f3" strokeWidth="9" strokeLinecap="round">
          <path d="M0 78h390" />
          <path d="M104 0v164" />
          <path d="M288 0v164" />
        </g>
        <g
          stroke="#e7dccb"
          strokeWidth="1"
          strokeDasharray="5 7"
          strokeLinecap="round"
        >
          <path d="M0 78h390" />
          <path d="M104 0v164" />
          <path d="M288 0v164" />
        </g>

        {/* walking radius */}
        <circle
          cx="196"
          cy="80"
          r="52"
          fill="#3a4936"
          opacity="0.06"
        />
        <circle
          cx="196"
          cy="80"
          r="52"
          fill="none"
          stroke="#3a4936"
          strokeWidth="1.2"
          strokeDasharray="4 5"
          opacity="0.4"
        />

        <text
          x="14"
          y="73"
          fill="#8d877b"
          fontSize="7"
          letterSpacing="1.4"
        >
          PALM AVE
        </text>
        <text
          x="110"
          y="152"
          fill="#8d877b"
          fontSize="7"
          letterSpacing="1.4"
          transform="rotate(-90 110 152)"
        >
          OAK ST
        </text>
      </svg>

      <span className="absolute left-3 top-3 rounded-full bg-cream/95 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.1em] text-olive shadow-sm backdrop-blur">
        Maple Grove
      </span>
      <span className="absolute right-3 top-3 rounded-full bg-cream/95 px-2.5 py-1 text-[9px] tabular-nums text-muted shadow-sm backdrop-blur">
        2.1 mi
      </span>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span className="absolute inset-0 -m-2.5 rounded-full border border-olive/20 bg-olive/5" />
        <span className="relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-cream bg-olive text-cream shadow-lg">
          <MapPinIcon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

function Overview({ home }: { home: Home }) {
  const scores = [
    { value: 78, label: "Walk Score" },
    { value: 52, label: "Transit" },
    { value: 64, label: "Bikeable" },
    { value: 24, label: "Min commute" },
  ];

  return (
    <div className="mt-4">
      <div className="grid grid-cols-2 gap-2.5">
        {scores.map((score) => (
          <div
            key={score.label}
            className="rounded-[18px] border border-line bg-white/50 px-4 py-3.5"
          >
            <p className="font-serif text-[24px] leading-none text-ink">
              {score.value}
            </p>
            <p className="mt-1.5 text-[10px] uppercase tracking-[0.1em] text-muted">
              {score.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-[20px] border border-line bg-white/50 p-4">
        <h2 className="font-serif text-[18px] text-ink">Around the corner</h2>
        <ul className="mt-3 space-y-2.5">
          {[
            { icon: "spark", text: "3 parks within a 10-minute walk" },
            { icon: "clock", text: "Grocery and cafés under 5 minutes away" },
            { icon: "pin", text: "Easy access to I-95 and the beach" },
            home.gated
              ? { icon: "shield", text: "Gated community with a staffed entry" }
              : { icon: "shield", text: "Established, owner-occupied street" },
          ].map((item) => (
            <li
              key={item.text}
              className="flex items-start gap-2.5 text-[11.5px] leading-5 text-ink/85"
            >
              <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-parchment text-olive">
                {item.icon === "clock" ? (
                  <ClockIcon className="h-3 w-3" />
                ) : item.icon === "pin" ? (
                  <MapPinIcon className="h-3 w-3" />
                ) : item.icon === "shield" ? (
                  <ShieldIcon className="h-3 w-3" />
                ) : (
                  <SparkleIcon className="h-3 w-3" />
                )}
              </span>
              {item.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Schools() {
  return (
    <div className="mt-4">
      <div className="overflow-hidden rounded-[20px] border border-line bg-white/50">
        {SCHOOLS.map((school, index) => (
          <div
            key={school.name}
            className={[
              "flex items-center gap-3 px-4 py-3.5",
              index > 0 ? "border-t border-line/70" : "",
            ].join(" ")}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-parchment font-serif text-[12px] text-olive">
              {school.level === "Elementary"
                ? "K"
                : school.level === "Middle"
                  ? "6"
                  : "9"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11.5px] font-medium text-ink">
                {school.name}
              </p>
              <p className="mt-0.5 text-[10px] text-muted">
                {school.level} <span className="px-0.5">·</span>{" "}
                {school.minutes} min drive
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-olive/10 px-2 py-1 text-[10px] font-medium tabular-nums text-olive">
              {school.score}/10
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-[10px] text-muted">
        School ratings are illustrative. Confirm zoning with the district.
      </p>
    </div>
  );
}

function Errands() {
  return (
    <div className="mt-4">
      <div className="overflow-hidden rounded-[20px] border border-line bg-white/50">
        {ERRANDS.map((item, index) => (
          <div
            key={item.label}
            className={[
              "flex items-center gap-3 px-4 py-3.5",
              index > 0 ? "border-t border-line/70" : "",
            ].join(" ")}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-parchment text-olive">
              <ClockIcon className="h-[15px] w-[15px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11.5px] font-medium text-ink">{item.label}</p>
              <p className="mt-0.5 text-[10px] text-muted">{item.detail}</p>
            </div>
            <span className="shrink-0 text-[11px] tabular-nums text-olive">
              {item.minutes} min
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-[10px] text-muted">
        Drive times are estimates at typical traffic.
      </p>
    </div>
  );
}

function Safety() {
  return (
    <div className="mt-4">
      <div className="rounded-[22px] bg-olive p-5 text-cream">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream/10">
          <ShieldIcon className="h-[18px] w-[18px]" />
        </span>
        <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-cream/55">
          Risk snapshot
        </p>
        <p className="mt-1.5 font-serif text-[22px] leading-tight">
          Low flood risk
        </p>
        <p className="mt-2 text-[11px] leading-5 text-cream/65">
          Outside high-risk flood and evacuation zones, on a quiet residential
          street.
        </p>
      </div>

      <div className="mt-4 space-y-2.5">
        {SAFETY_ITEMS.map((item) => (
          <div
            key={item.title}
            className="flex items-start gap-3 rounded-[18px] border border-line bg-white/50 px-4 py-3.5"
          >
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-olive/10 text-olive">
              <CheckIcon className="h-3 w-3" />
            </span>
            <div>
              <p className="text-[11.5px] font-medium text-ink">{item.title}</p>
              <p className="mt-1 text-[10.5px] leading-[1.6] text-muted">
                {item.detail}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-center text-[10px] text-muted">
        Verify insurance and flood maps with the county before making an offer.
      </p>
    </div>
  );
}
