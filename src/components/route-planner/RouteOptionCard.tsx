"use client";

import { CommuteMode } from "@/types/routes";

export interface RouteOptionCardProps {
  mode: CommuteMode;
  etaMinutes: number;
  relativeTimeLabel: string; // e.g. "2 min slower than fastest"
  co2Kg: number;
  co2SavingsPercent: number; // e.g. 60 for "60% less CO₂"
  costEstimate: number; // numeric cost, we'll display as $x.xx
  selected?: boolean;
  onSelect?: () => void;
  arrivalTimeLabel?: string; // e.g. "Arrives at 8:32 AM"
}

const modeIcons: Record<CommuteMode, string> = {
  BIKE: "🚲",
  TRANSIT: "🚌",
  CAR: "🚗",
  WALK: "👣",
  CARPOOL: "🚙",
};

const modeLabels: Record<CommuteMode, string> = {
  BIKE: "Bike",
  TRANSIT: "Transit",
  CAR: "Car",
  WALK: "Walk",
  CARPOOL: "Carpool",
};

function formatDurationMinutes(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes) || totalMinutes < 0) return "-";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} hr${hours > 1 ? "s" : ""}`;
  }

  return `${hours} hr${hours > 1 ? "s" : ""} ${minutes} min`;
}

export function RouteOptionCard({
  mode,
  etaMinutes,
  relativeTimeLabel,
  co2Kg,
  co2SavingsPercent,
  costEstimate,
  selected = false,
  onSelect,
  arrivalTimeLabel,
}: RouteOptionCardProps) {
  const handleClick = () => {
    onSelect?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect?.();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        rounded-xl border shadow-sm p-4 cursor-pointer transition-all
        ${selected ? "border-leaf bg-mist shadow-md" : "border-gray-200 bg-white"}
        ${!selected && "hover:border-leaf/40"}
        hover:shadow-md hover:-translate-y-0.5
        focus:outline-none focus:ring-2 focus:ring-leaf focus:ring-offset-2
      `}
    >
      {/* Top row: Mode chip (left) + ETA (right) */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{modeIcons[mode]}</span>
          <span className="text-sm font-medium text-earth">{modeLabels[mode]}</span>
        </div>
        <div className="text-2xl font-bold text-earth">{formatDurationMinutes(etaMinutes)}</div>
      </div>

      {/* Second row: Relative time label */}
      <div className="text-sm text-gray-600 mb-3">
        {relativeTimeLabel}
        {arrivalTimeLabel && (
          <p className="text-xs text-gray-500 mt-1">{arrivalTimeLabel}</p>
        )}
      </div>

      {/* Third row: CO₂ stats + Cost */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-earth">
              {co2Kg.toFixed(1)} kg CO₂
            </span>
            {co2SavingsPercent > 0 && (
              <span className="bg-leaf/10 text-leaf text-xs rounded-full px-2 py-0.5 font-medium">
                {co2SavingsPercent}% less CO₂
              </span>
            )}
          </div>
          <div className="text-sm font-medium text-earth">
            ${costEstimate.toFixed(2)}
          </div>
        </div>
        {co2SavingsPercent > 0 && (
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-leaf transition-all duration-300"
              style={{ width: `${co2SavingsPercent}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

