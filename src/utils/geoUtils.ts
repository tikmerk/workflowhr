// Haversine formula to compute great-circle distance between two GPS coordinates in meters
export function calculateDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export function validateGeofence(
  userLat: number,
  userLon: number,
  branchLat: number,
  branchLon: number,
  radiusMeters: number
): { isWithinRadius: boolean; distanceMeters: number; statusText: string } {
  const distance = calculateDistanceInMeters(userLat, userLon, branchLat, branchLon);
  const isWithin = distance <= radiusMeters;
  return {
    isWithinRadius: isWithin,
    distanceMeters: distance,
    statusText: isWithin
      ? `Within Branch Zone (${distance}m / max ${radiusMeters}m)`
      : `Outside Branch Boundary (${distance}m away / allowed: ${radiusMeters}m)`,
  };
}

export function getMockAddressFromCoords(lat: number, lon: number, branchName: string): string {
  return `${branchName} Campus, Coordinates: ${lat.toFixed(5)}° N, ${lon.toFixed(5)}° E`;
}
