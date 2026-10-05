import type { IAutoMovieHumanFaceMidlinePair } from "@automovie/human/face/structures/IAutoMovieHumanFaceMidlinePair";

import { findHumanSourceShortestPath } from "./findHumanSourceShortestPath.ts";
import type { IHumanSourceLipMargin } from "./structures/IHumanSourceLipMargin.ts";
import type { IHumanSourceLipMarginChain } from "./structures/IHumanSourceLipMarginChain.ts";

/**
 * The vermilion margin chains, by the face contact owner's chain rule.
 *
 * The commissure limit, the two vermilion components and the 2 mm station
 * pairs come from `findHumanSourceLipMarginPairs`. The anchors are the station
 * pairs plus the central contact pair; upper anchors go to the upper chain and
 * lower anchors to the lower one. The edge graph is the lips-region triangles
 * whose three vertices all lie within the limit along the jaw axis, weighted
 * by 3D edge length. Each chain's stops are its component's minimum-along
 * vertex (the negative join), its anchors sorted along the axis, and its
 * maximum-along vertex (the positive join); consecutive stops are joined by
 * the shortest path over the component's edges, the joints' repeats dropped
 * and later repeats removed keeping the first occurrence. A missing path, an
 * anchor outside its component, a chain under two vertices or a vertex in both
 * chains refuses by name.
 */
export function buildHumanSourceLipMarginChain(
  positions: readonly number[],
  region: readonly number[],
  axis: readonly number[],
  margin: IHumanSourceLipMargin,
  central: IAutoMovieHumanFaceMidlinePair,
): IHumanSourceLipMarginChain {
  const p = positions;
  const along = (v: number): number => p[3 * v] * axis[0] + p[3 * v + 1] * axis[1] + p[3 * v + 2] * axis[2];
  const edges = new Map<number, Map<number, number>>();
  for (let t = 0; t < region.length; t += 3) {
    const triangle = region.slice(t, t + 3);
    if (triangle.some((v) => Math.abs(along(v)) > margin.limitMetres)) continue;
    for (const a of triangle)
      for (const b of triangle)
        if (a !== b) {
          if (!edges.has(a)) edges.set(a, new Map());
          edges.get(a)!.set(b, Math.hypot(p[3 * a] - p[3 * b], p[3 * a + 1] - p[3 * b + 1], p[3 * a + 2] - p[3 * b + 2]));
        }
  }
  const chain = (name: "upper" | "lower"): number[] => {
    const component = margin[name];
    const members = new Set(component);
    const anchors = [...margin.pairs.map((pair) => pair[name]), central[name]];
    for (const anchor of anchors) if (!members.has(anchor)) throw new Error(`Lip margin chain: ${name} anchor ${anchor} is outside the ${name} vermilion.`);
    const extreme = (sense: 1 | -1): number => component.reduce((best, v) => (sense * along(v) > sense * along(best) || (along(v) === along(best) && v < best) ? v : best));
    const stops = [extreme(-1), ...[...new Set(anchors)].sort((a, b) => along(a) - along(b) || a - b), extreme(1)];
    const local = new Map<number, Map<number, number>>();
    for (const v of component) local.set(v, new Map([...(edges.get(v) ?? new Map<number, number>())].filter(([next]) => members.has(next))));
    const out: number[] = [stops[0]];
    for (let i = 1; i < stops.length; i++) {
      const path = findHumanSourceShortestPath(local, stops[i - 1], stops[i]);
      if (path === null) throw new Error(`Lip margin chain: no ${name} path from ${stops[i - 1]} to ${stops[i]}.`);
      out.push(...path.slice(1));
    }
    const vertices = [...new Set(out)];
    if (vertices.length < 2) throw new Error(`Lip margin chain: the ${name} chain has fewer than two vertices.`);
    return vertices;
  };
  const upper = chain("upper");
  const lower = chain("lower");
  const shared = upper.filter((v) => lower.includes(v));
  if (shared.length > 0) throw new Error(`Lip margin chain: vertices ${shared.join(", ")} are in both chains.`);
  return {
    upper,
    lower,
    record: {
      rule: "anchors = 2 mm station pairs and the central contact pair; stops = negative join, anchors by along, positive join; consecutive stops joined by the shortest 3D path over the component's lips triangles within the limit; first occurrences kept",
      limitMetres: margin.limitMetres,
      stationMetres: margin.stationMetres,
      anchors: margin.pairs.length + 1,
      upperVertices: upper.length,
      lowerVertices: lower.length,
      joins: { upper: [upper[0], upper[upper.length - 1]], lower: [lower[0], lower[lower.length - 1]] },
    },
  };
}
