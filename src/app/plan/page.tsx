"use client";

import { useState } from "react";
import { RouteOptionCard } from "@/components/route-planner/RouteOptionCard";
import { RouteOption, RoutePlanResponse } from "@/types/routes";
import RouteMap from "@/components/map/RouteMap";

export default function PlanPage() {
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [submittedOrigin, setSubmittedOrigin] = useState<string>("");
  const [submittedDestination, setSubmittedDestination] = useState<string>("");
  const [submittedDeparture, setSubmittedDeparture] = useState<Date | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Client-side validation
    const trimmedOrigin = origin.trim();
    const trimmedDestination = destination.trim();
    const trimmedDate = date.trim();
    const trimmedTime = time.trim();

    if (!trimmedOrigin || !trimmedDestination || !trimmedDate || !trimmedTime) {
      setApiError("Please fill in all required fields: origin, destination, date, and time.");
      return;
    }

    // Compute departure date from date + time
    let departure: Date | null = null;
    try {
      if (trimmedDate && trimmedTime) {
        // Combine into a single ISO-like string
        const isoString = `${trimmedDate}T${trimmedTime}`;
        const d = new Date(isoString);
        if (!isNaN(d.getTime())) {
          departure = d;
        }
      }
    } catch {
      departure = null;
    }
    setSubmittedDeparture(departure);

    setIsSearching(true);
    setApiError(null);

    try {
      const res = await fetch("/api/routes/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origin: trimmedOrigin,
          destination: trimmedDestination,
          date: trimmedDate,
          time: trimmedTime,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.error || "Failed to fetch route options");
      }

      const data = (await res.json()) as RoutePlanResponse;
      setRouteOptions(data.options || []);
      setSelectedIndex(data.options && data.options.length > 0 ? 0 : null);
      setSubmittedOrigin(trimmedOrigin);
      setSubmittedDestination(trimmedDestination);
    } catch (error: any) {
      console.error("Error fetching route options:", error);
      setApiError(error.message || "Something went wrong while planning routes.");
      setRouteOptions([]);
      setSelectedIndex(null);
    } finally {
      setIsSearching(false);
    }
  };

  function getArrivalTimeLabel(etaMinutes: number): string | null {
    if (!submittedDeparture) return null;

    const arrival = new Date(
      submittedDeparture.getTime() + etaMinutes * 60 * 1000
    );

    // Format as a nice time label, e.g. "Arrives at 8:32 AM"
    const timePart = arrival.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    return `Arrives at ${timePart}`;
  }

  return (
    <div className="min-h-screen bg-mist flex flex-col lg:flex-row gap-6 p-6">
      {/* Search Panel */}
      <section className="w-full lg:w-[320px] lg:flex-shrink-0 bg-mist lg:border-r border-sky p-4 lg:p-6 flex flex-col gap-4">
        {/* Search Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-6 border border-earth/20">
          {/* Route Search Section */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-earth">Route Search</h2>
            <div className="flex flex-col gap-2">
              <label htmlFor="origin" className="text-sm font-medium text-earth">
                From (Origin)
              </label>
              <input
                type="text"
                id="origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Enter starting location"
                className="w-full px-4 py-2 border border-earth/30 rounded-lg bg-white text-earth placeholder:text-gray-400 focus:outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="destination" className="text-sm font-medium text-earth">
                To (Destination)
              </label>
              <input
                type="text"
                id="destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Enter destination"
                className="w-full px-4 py-2 border border-earth/30 rounded-lg bg-white text-earth placeholder:text-gray-400 focus:outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
              />
            </div>
          </div>

          {/* Travel Details Section */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-earth">Travel Details</h2>
            <div className="flex flex-col gap-2">
              <label htmlFor="date" className="text-sm font-medium text-earth">
                Date
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 border border-earth/30 rounded-lg bg-white text-earth focus:outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="time" className="text-sm font-medium text-earth">
                Time
              </label>
              <input
                type="time"
                id="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-2 border border-earth/30 rounded-lg bg-white text-earth focus:outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className={`w-full mt-4 px-6 py-3 bg-gradient-to-r from-leaf to-sky text-white font-semibold rounded-lg shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-leaf focus:ring-offset-2 ${
              isSearching
                ? "opacity-50 cursor-not-allowed"
                : "hover:shadow-lg hover:scale-[1.02]"
            }`}
          >
            {isSearching ? "🔄 Finding Routes..." : "Find Green Routes"}
          </button>
        </form>
      </section>

      {/* Map + Results */}
      <section className="flex-1 flex flex-col gap-4">
        {/* Map Area */}
        <div className="space-y-4">
          <div className="sticky top-0 z-10 lg:static">
            <RouteMap origin={submittedOrigin} destination={submittedDestination} />
          </div>
        </div>

        {/* Route Results */}
        <div className="w-full bg-mist p-4">
          <h2 className="text-xl font-bold text-earth mb-4">Route Options</h2>

          {isSearching && (
            <div className="mb-4 text-sm text-gray-600 flex items-center gap-2">
              <span className="animate-spin">🔄</span>
              <span>Finding green routes...</span>
            </div>
          )}

          {apiError && (
            <p className="text-sm text-red-600 mb-4">{apiError}</p>
          )}

          {routeOptions.length === 0 && !isSearching && !apiError && (
            <p className="text-sm text-gray-500 mb-4">
              Enter a route and click "Find Green Routes" to see suggestions.
            </p>
          )}

          <div className="flex flex-col space-y-4">
            {routeOptions.map((option, index) => (
              <RouteOptionCard
                key={option.id}
                mode={option.mode}
                etaMinutes={option.etaMinutes}
                relativeTimeLabel={option.relativeTimeLabel}
                co2Kg={option.co2Kg}
                co2SavingsPercent={option.co2SavingsPercent}
                costEstimate={option.costEstimate}
                selected={selectedIndex === index}
                onSelect={() => setSelectedIndex(index)}
                arrivalTimeLabel={getArrivalTimeLabel(option.etaMinutes) ?? undefined}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

