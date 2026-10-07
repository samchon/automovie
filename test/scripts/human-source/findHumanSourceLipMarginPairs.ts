import type { IHumanSourceLipMargin } from "./structures/IHumanSourceLipMargin.ts";
import type { IHumanSourceLipMarginPair } from "./structures/IHumanSourceLipMarginPair.ts";

/** Station spacing along the jaw axis, metres: the face contact owner's sampling convention. */
const STATION_METRES = 0.002;

/**
 * The vermilion margin pairs of the lips region, by the face contact owner's
 * rule (reproduced here so the producer does not depend on another owner's
 * script). Away from the commissures the fissure splits the lips region into
 * upper and lower vermilion, joined only at the commissures. The commissure
 * limit is the largest distance along the jaw axis within which the region's
 * triangles form two components, descending from the region's extent by an
 * eighth of a station. Stations lie at ±k stations (k ≥ 1) while k stations
 * stay below the limit less half a station; the midline is the central pair
 * and is excluded. At each station the pair is the upper component's lowest
 * vertex and the lower component's highest vertex along the opening
 * direction (basis Y-up without its jaw-axis component), within half a
 * station. A region that never splits refuses.
 */
export function findHumanSourceLipMarginPairs(
  positions: readonly number[],
  region: readonly number[],
  axis: readonly number[],
): IHumanSourceLipMargin {
  const p = positions;
  const rise = [-axis[0] * axis[1], 1 - axis[1] * axis[1], -axis[2] * axis[1]];
  const length = Math.hypot(rise[0], rise[1], rise[2]);
  const up = rise.map((value) => value / length);
  const along = (v: number): number =>
    p[3 * v] * axis[0] + p[3 * v + 1] * axis[1] + p[3 * v + 2] * axis[2];
  const height = (v: number): number =>
    p[3 * v] * up[0] + p[3 * v + 1] * up[1] + p[3 * v + 2] * up[2];
  const components = (limit: number): number[][] => {
    const adjacency = new Map<number, number[]>();
    for (let t = 0; t < region.length; t += 3) {
      const triangle = region.slice(t, t + 3);
      if (triangle.some((v) => Math.abs(along(v)) > limit)) continue;
      for (const a of triangle)
        for (const b of triangle)
          if (a !== b) {
            if (!adjacency.has(a)) adjacency.set(a, []);
            adjacency.get(a)!.push(b);
          }
    }
    const seen = new Set<number>();
    const result: number[][] = [];
    for (const start of adjacency.keys()) {
      if (seen.has(start)) continue;
      const component = [start];
      seen.add(start);
      for (let at = 0; at < component.length; at++)
        for (const next of adjacency.get(component[at])!)
          if (!seen.has(next)) {
            seen.add(next);
            component.push(next);
          }
      result.push(component);
    }
    return result.sort((a, b) => b.length - a.length);
  };
  let limit = Math.max(...region.map((v) => Math.abs(along(v))));
  let parts = components(limit);
  while (parts.length < 2 && limit > STATION_METRES) {
    limit -= STATION_METRES / 8;
    parts = components(limit);
  }
  if (parts.length < 2)
    throw new Error(
      "The lips region never separates into upper and lower vermilion.",
    );
  const mean = (component: number[]): number =>
    component.reduce((total, v) => total + height(v), 0) / component.length;
  const [upper, lower] =
    mean(parts[0]) > mean(parts[1])
      ? [parts[0], parts[1]]
      : [parts[1], parts[0]];
  const pairs: IHumanSourceLipMarginPair[] = [];
  for (const sign of [-1, 1])
    for (let k = 1; k * STATION_METRES < limit - STATION_METRES / 2; k++) {
      const station = sign * k * STATION_METRES;
      const near = (v: number): boolean =>
        Math.abs(along(v) - station) <= STATION_METRES / 2;
      const top = upper.filter(near);
      const bottom = lower.filter(near);
      if (top.length === 0 || bottom.length === 0) continue;
      pairs.push({
        upper: top.reduce((best, v) => (height(v) < height(best) ? v : best)),
        lower: bottom.reduce((best, v) =>
          height(v) > height(best) ? v : best,
        ),
      });
    }
  return {
    pairs,
    limitMetres: limit,
    stationMetres: STATION_METRES,
    upper,
    lower,
  };
}
