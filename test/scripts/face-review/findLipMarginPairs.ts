import type { IAutoMovieHumanFaceBasis } from "@automovie/human";

import type { IFaceLipMarginAnchor } from "./IFaceLipMarginAnchor";

/**
 * The station anchors of a lips region's vermilion margin chains, from the
 * midline toward each commissure (`findLipMargin` joins them into chains).
 *
 * Rule: away from the commissures the oral fissure separates the lips region
 * into two connected components, upper and lower vermilion, which join only at
 * the commissures. The commissure limit is found per shape as the largest
 * distance along the mandibular axis within which the region's triangles form
 * two components (descending from the region's extent by an eighth of a
 * station). Stations lie every `stationMetres` along the axis on both sides of
 * the midline, excluding the midline (the central pair) and the last half
 * station before the limit; at each station the pair is the upper component's
 * lowest vertex and the lower component's highest vertex along the opening
 * direction (basis Y-up without its axis component) within half a station.
 * The station spacing is a stated sampling convention.
 */
export function findLipMarginPairs(props: {
  surface: IAutoMovieHumanFaceBasis["surfaces"][number];
  region: readonly number[];
  axis: readonly [number, number, number];
  stationMetres: number;
}): { pairs: IFaceLipMarginAnchor[]; limitMetres: number } {
  const { surface, region, axis, stationMetres } = props;
  const p = surface.positions;
  const raisedLength = Math.hypot(-axis[0] * axis[1], 1 - axis[1] * axis[1], -axis[2] * axis[1]);
  const up = [-axis[0] * axis[1], 1 - axis[1] * axis[1], -axis[2] * axis[1]].map(
    (value) => value / raisedLength,
  );
  const along = (v: number) => p[3 * v] * axis[0] + p[3 * v + 1] * axis[1] + p[3 * v + 2] * axis[2];
  const height = (v: number) => p[3 * v] * up[0] + p[3 * v + 1] * up[1] + p[3 * v + 2] * up[2];
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
  const extent = Math.max(...region.map((v) => Math.abs(along(v))));
  let limit = extent;
  let parts = components(limit);
  while (parts.length < 2 && limit > stationMetres) {
    limit -= stationMetres / 8;
    parts = components(limit);
  }
  if (parts.length < 2)
    throw new Error(`${surface.id}: the lips region never separates into upper and lower vermilion.`);
  const mean = (component: number[]) =>
    component.reduce((total, v) => total + height(v), 0) / component.length;
  const [upper, lower] =
    mean(parts[0]) > mean(parts[1]) ? [parts[0], parts[1]] : [parts[1], parts[0]];
  const pairs: IFaceLipMarginAnchor[] = [];
  for (const sign of [-1, 1])
    for (let k = 1; k * stationMetres < limit - stationMetres / 2; k++) {
      const station = sign * k * stationMetres;
      const near = (v: number) => Math.abs(along(v) - station) <= stationMetres / 2;
      const top = upper.filter(near);
      const bottom = lower.filter(near);
      if (top.length === 0 || bottom.length === 0) continue;
      pairs.push({
        upper: top.reduce((best, v) => (height(v) < height(best) ? v : best)),
        lower: bottom.reduce((best, v) => (height(v) > height(best) ? v : best)),
      });
    }
  return { pairs, limitMetres: limit };
}
