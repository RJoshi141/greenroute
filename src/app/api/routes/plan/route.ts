import { NextRequest, NextResponse } from "next/server";
import {
  RoutePlanRequest,
  RoutePlanResponse,
  RouteOption,
  CommuteMode,
} from "@/types/routes";

const EMISSION_FACTORS: Record<CommuteMode, number> = {
  CAR: 0.192, // example: average petrol car
  CARPOOL: 0.096, // assume half impact per passenger
  TRANSIT: 0.075, // bus/rail per passenger km
  BIKE: 0,
  WALK: 0,
};

const GOOGLE_MAPS_SERVER_API_KEY = process.env.GOOGLE_MAPS_SERVER_API_KEY;

if (!GOOGLE_MAPS_SERVER_API_KEY) {
  console.warn("GOOGLE_MAPS_SERVER_API_KEY is not set");
}

async function fetchRouteForMode(
  origin: string,
  destination: string,
  mode: CommuteMode
): Promise<{ distanceKm: number; etaMinutes: number } | null> {
  if (!GOOGLE_MAPS_SERVER_API_KEY) return null;

  // Map our CommuteMode to Google directions mode
  const googleModeMap: Record<CommuteMode, string> = {
    CAR: "driving",
    CARPOOL: "driving",
    TRANSIT: "transit",
    BIKE: "bicycling",
    WALK: "walking",
  };

  const googleMode = googleModeMap[mode];

  const params = new URLSearchParams({
    origin,
    destination,
    mode: googleMode,
    key: GOOGLE_MAPS_SERVER_API_KEY,
  });

  const url = `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      console.error(
        `Directions API error for ${mode}:`,
        res.status,
        await res.text()
      );
      return null;
    }

    const json = await res.json();

    if (
      !json.routes ||
      json.routes.length === 0 ||
      !json.routes[0].legs ||
      json.routes[0].legs.length === 0
    ) {
      console.warn(`No routes found for mode ${mode}`);
      return null;
    }

    const leg = json.routes[0].legs[0];
    const distanceMeters = leg.distance?.value;
    const durationSeconds = leg.duration?.value;

    if (distanceMeters == null || durationSeconds == null) {
      console.warn(`Missing distance/duration for mode ${mode}`);
      return null;
    }

    const distanceKm = distanceMeters / 1000;
    const etaMinutes = Math.round(durationSeconds / 60);

    return { distanceKm, etaMinutes };
  } catch (error) {
    console.error(`Error fetching route for ${mode}:`, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<RoutePlanRequest>;

    const { origin, destination, date, time } = body;

    // Basic validation - check for existence and non-empty strings
    if (
      !origin ||
      !destination ||
      !date ||
      !time ||
      typeof origin !== "string" ||
      typeof destination !== "string" ||
      typeof date !== "string" ||
      typeof time !== "string" ||
      origin.trim().length === 0 ||
      destination.trim().length === 0 ||
      date.trim().length === 0 ||
      time.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required fields: origin, destination, date, time" },
        { status: 400 }
      );
    }

    if (!GOOGLE_MAPS_SERVER_API_KEY) {
      return NextResponse.json(
        { error: "Server directions API key is not configured" },
        { status: 500 }
      );
    }

    const modes: CommuteMode[] = ["CAR", "CARPOOL", "TRANSIT", "BIKE", "WALK"];

    // Fetch directions for each mode in parallel
    const results = await Promise.all(
      modes.map(async (mode) => {
        const route = await fetchRouteForMode(origin, destination, mode);
        return { mode, route };
      })
    );

    // Filter out modes where we got no valid route
    const validRoutes = results.filter(
      (r) => r.route !== null
    ) as Array<{
      mode: CommuteMode;
      route: { distanceKm: number; etaMinutes: number };
    }>;

    if (validRoutes.length === 0) {
      const response: RoutePlanResponse = { options: [] };
      return NextResponse.json(response, { status: 200 });
    }

    // Determine fastest ETA for relative labels
    const fastestEta = Math.min(...validRoutes.map((r) => r.route.etaMinutes));

    // Baseline: CAR route CO₂ (for savings %)
    const carRoute = validRoutes.find((r) => r.mode === "CAR");
    const baselineCarCo2 =
      carRoute && carRoute.route
        ? carRoute.route.distanceKm * EMISSION_FACTORS.CAR
        : 0;

    const options: RouteOption[] = validRoutes.map(({ mode, route }, index) => {
      const { distanceKm, etaMinutes } = route;

      // Simple cost model (can be refined later)
      let costEstimate = 0;
      switch (mode) {
        case "CAR":
          costEstimate = distanceKm * 0.3; // e.g. fuel cost approximation
          break;
        case "CARPOOL":
          costEstimate = distanceKm * 0.15;
          break;
        case "TRANSIT":
          costEstimate = 2 + distanceKm * 0.1; // base fare + per km
          break;
        case "BIKE":
        case "WALK":
          costEstimate = 0;
          break;
      }

      const co2Kg = distanceKm * EMISSION_FACTORS[mode];

      let co2SavingsPercent = 0;
      if (baselineCarCo2 > 0) {
        co2SavingsPercent = Math.max(
          0,
          Math.round((1 - co2Kg / baselineCarCo2) * 100)
        );
      }

      let relativeTimeLabel = "";
      if (etaMinutes === fastestEta) {
        relativeTimeLabel = "Fastest option";
      } else {
        const diff = etaMinutes - fastestEta;
        if (diff > 0) {
          relativeTimeLabel = `${diff} min slower than fastest`;
        } else if (diff < 0) {
          relativeTimeLabel = `${Math.abs(diff)} min faster than fastest`;
        }
      }

      return {
        id: `${mode.toLowerCase()}-${index}`,
        mode,
        etaMinutes,
        relativeTimeLabel,
        co2Kg: parseFloat(co2Kg.toFixed(2)),
        co2SavingsPercent,
        costEstimate: parseFloat(costEstimate.toFixed(2)),
      };
    });

    // Sort options by ETA ascending
    options.sort((a, b) => a.etaMinutes - b.etaMinutes);

    const response: RoutePlanResponse = { options };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error in /api/routes/plan:", error);
    return NextResponse.json(
      { error: "Unexpected error while planning route" },
      { status: 500 }
    );
  }
}
