"use client";

import { useEffect, useMemo, useState } from "react";
import {
  GoogleMap,
  DirectionsRenderer,
  useLoadScript,
} from "@react-google-maps/api";

interface RouteMapProps {
  origin: string;
  destination: string;
}

export default function RouteMap({ origin, destination }: RouteMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey ?? "",
  });

  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [directionsError, setDirectionsError] = useState<string | null>(null);

  const center = useMemo(
    () => ({ lat: 37.7749, lng: -122.4194 }),
    []
  );

  useEffect(() => {
    if (!isLoaded) return;

    if (!origin || !destination) {
      setDirections(null);
      setDirectionsError(null);
      return;
    }

    const service = new google.maps.DirectionsService();
    setIsRequesting(true);
    setDirectionsError(null);

    service.route(
      {
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
        } else {
          console.error("Directions request failed:", status, result);
          setDirections(null);
          setDirectionsError("Could not calculate route for this selection.");
        }
        setIsRequesting(false);
      }
    );
  }, [isLoaded, origin, destination]);

  return (
    <div className="relative w-full h-56 md:h-64 lg:h-72 rounded-xl overflow-hidden border border-sky/40 shadow-sm bg-mist">
      {loadError && (
        <div className="h-full flex items-center justify-center text-sm text-red-600 px-4">
          Unable to load map.
        </div>
      )}

      {!loadError && !isLoaded && (
        <div className="h-full flex items-center justify-center text-sm text-gray-500 px-4">
          Loading map…
        </div>
      )}

      {!loadError && isLoaded && (
        <GoogleMap
          zoom={10}
          center={center}
          mapContainerClassName="w-full h-full"
          options={{
            disableDefaultUI: true,
            zoomControl: true,
          }}
        >
          {directions && <DirectionsRenderer directions={directions} />}
        </GoogleMap>
      )}

      {!origin && !destination && isLoaded && !loadError && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-gray-600 px-4">
          Enter a route and click "Find Green Routes" to see it here.
        </div>
      )}

      {directionsError && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
          <span className="inline-flex rounded-full bg-white/90 px-3 py-1 text-xs text-red-600 shadow">
            {directionsError}
          </span>
        </div>
      )}

      {isRequesting && (
        <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center">
          <span className="inline-flex rounded-full bg-white/90 px-3 py-1 text-xs text-gray-700 shadow">
            Finding route on map…
          </span>
        </div>
      )}
    </div>
  );
}

