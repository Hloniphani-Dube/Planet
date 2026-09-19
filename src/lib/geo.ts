const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

export interface LatLng {
  lat: number;
  lng: number;
}

/** Standard geohash. Precision 6 is a cell of roughly 1.2 km x 0.6 km; precision 7 is
 * roughly 150 m x 150 m. */
export function encodeGeohash(lat: number, lng: number, precision: number): string {
  let latRange: [number, number] = [-90, 90];
  let lngRange: [number, number] = [-180, 180];
  let hash = "";
  let bits = 0;
  let bitCount = 0;
  let even = true;

  while (hash.length < precision) {
    const range = even ? lngRange : latRange;
    const value = even ? lng : lat;
    const mid = (range[0] + range[1]) / 2;
    bits <<= 1;
    if (value >= mid) {
      bits |= 1;
      range[0] = mid;
    } else {
      range[1] = mid;
    }
    even = !even;
    bitCount += 1;
    if (bitCount === 5) {
      hash += BASE32[bits];
      bits = 0;
      bitCount = 0;
    }
  }
  return hash;
}

/** The centre of a geohash cell. */
export function decodeGeohash(hash: string): LatLng {
  let latRange: [number, number] = [-90, 90];
  let lngRange: [number, number] = [-180, 180];
  let even = true;

  for (const char of hash) {
    const value = BASE32.indexOf(char);
    if (value === -1) throw new Error(`Invalid geohash character: ${char}`);
    for (let bit = 4; bit >= 0; bit -= 1) {
      const range = even ? lngRange : latRange;
      const mid = (range[0] + range[1]) / 2;
      if ((value >> bit) & 1) range[0] = mid;
      else range[1] = mid;
      even = !even;
    }
  }
  return {
    lat: (latRange[0] + latRange[1]) / 2,
    lng: (lngRange[0] + lngRange[1]) / 2,
  };
}

export interface BlurredPoint extends LatLng {
  geohash: string;
}

/** Snaps an exact position to the centre of a geohash cell. The exact position is never
 * stored or sent anywhere; only the cell centre and its hash are. */
export function blurPoint(point: LatLng, precision: number): BlurredPoint {
  const geohash = encodeGeohash(point.lat, point.lng, precision);
  return { ...decodeGeohash(geohash), geohash };
}

/** A lat/lng box around a point, for a cheap "near me" query. */
export function boundingBox(center: LatLng, radiusKm: number) {
  const dLat = radiusKm / 111;
  const dLng = radiusKm / (111 * Math.max(Math.cos((center.lat * Math.PI) / 180), 0.01));
  return {
    minLat: center.lat - dLat,
    maxLat: center.lat + dLat,
    minLng: center.lng - dLng,
    maxLng: center.lng + dLng,
  };
}
