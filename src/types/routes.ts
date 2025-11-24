export type CommuteMode = "CAR" | "CARPOOL" | "TRANSIT" | "BIKE" | "WALK";

export interface RoutePlanRequest {
  origin: string;
  destination: string;
  date: string; // ISO date string, e.g. "2025-12-03"
  time: string; // time string, e.g. "06:57"
}

export interface RouteOption {
  id: string;
  mode: CommuteMode;
  etaMinutes: number;
  relativeTimeLabel: string;
  co2Kg: number;
  co2SavingsPercent: number;
  costEstimate: number;
}

export interface RoutePlanResponse {
  options: RouteOption[];
}

