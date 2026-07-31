/**
 * Calculates the distance in km between two lat/lng points using the
 * Haversine formula. Accurate enough for suburb-to-campus distances
 * (within a few dozen km), which is all we need here.
 */
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Round to 1 decimal place for display: "2.3 km".
 */
export function formatDistance(km: number): string {
  return `${Math.round(km * 10) / 10} km`;
}
