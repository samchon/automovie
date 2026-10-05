import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceLipMargin,
} from "@automovie/human";

import { findLipMarginPairs } from "./findLipMarginPairs";

/**
 * The vermilion margin chains of a lips region: the upper lip's lower edge and
 * the lower lip's upper edge along the oral fissure, commissure to commissure.
 *
 * Rule: the station pairs of `findLipMarginPairs` (with the central pair) are
 * anchors on each edge. Each chain runs through its component's anchors in
 * order along the mandibular axis, joining consecutive anchors by the shortest
 * path over the component's mesh edges, and continues the same way from the
 * outermost anchor to the component's lateral-most vertex inside the
 * commissure limit (the join). So every chain is a connected edge path along
 * the fissure with no break between anchors or before the join; the station
 * spacing fixes only the anchors, never which vertices between them close.
 */
export function findLipMargin(props: {
  surface: IAutoMovieHumanFaceBasis["surfaces"][number];
  region: readonly number[];
  axis: readonly [number, number, number];
  stationMetres: number;
  central: { upper: number; lower: number };
}): { margin: IAutoMovieHumanFaceLipMargin; limitMetres: number } {
  const { surface, region, axis } = props;
  const { pairs, limitMetres } = findLipMarginPairs(props);
  const p = surface.positions;
  const along = (v: number) => p[3 * v] * axis[0] + p[3 * v + 1] * axis[1] + p[3 * v + 2] * axis[2];
  const edges = new Map<number, Map<number, number>>();
  for (let t = 0; t < region.length; t += 3) {
    const triangle = region.slice(t, t + 3);
    if (!triangle.every((v) => Math.abs(along(v)) <= limitMetres)) continue;
    for (const a of triangle)
      for (const b of triangle)
        if (a !== b) {
          if (!edges.has(a)) edges.set(a, new Map());
          edges.get(a)!.set(
            b,
            Math.hypot(p[3 * a] - p[3 * b], p[3 * a + 1] - p[3 * b + 1], p[3 * a + 2] - p[3 * b + 2]),
          );
        }
  }
  const component = (start: number): number[] => {
    const found = [start];
    const seen = new Set(found);
    for (let at = 0; at < found.length; at++)
      for (const next of edges.get(found[at])!.keys())
        if (!seen.has(next)) {
          seen.add(next);
          found.push(next);
        }
    return found;
  };
  const shortest = (from: number, to: number): number[] => {
    const distance = new Map([[from, 0]]);
    const previous = new Map<number, number>();
    const open = new Set([from]);
    while (open.size > 0) {
      let current = -1;
      for (const v of open)
        if (current === -1 || distance.get(v)! < distance.get(current)!) current = v;
      open.delete(current);
      if (current === to) break;
      for (const [next, length] of edges.get(current)!) {
        const candidate = distance.get(current)! + length;
        if (candidate < (distance.get(next) ?? Infinity)) {
          distance.set(next, candidate);
          previous.set(next, current);
          open.add(next);
        }
      }
    }
    if (!previous.has(to) && from !== to)
      throw new Error(`${surface.id}: no lips-region edge path joins margin vertices ${from} and ${to}.`);
    const path = [to];
    while (path[0] !== from) path.unshift(previous.get(path[0])!);
    return path;
  };
  const chain = (centre: number, anchors: number[]): number[] => {
    const members = component(centre);
    const ordered = [...new Set([centre, ...anchors])].sort((a, b) => along(a) - along(b));
    const left = members.reduce((best, v) => (along(v) < along(best) ? v : best));
    const right = members.reduce((best, v) => (along(v) > along(best) ? v : best));
    const stops = [left, ...ordered, right];
    const result: number[] = [];
    for (let i = 0; i + 1 < stops.length; i++) {
      const path = shortest(stops[i], stops[i + 1]);
      result.push(...(i === 0 ? path : path.slice(1)));
    }
    return [...new Set(result)];
  };
  return {
    margin: {
      upper: chain(props.central.upper, pairs.map((pair) => pair.upper)),
      lower: chain(props.central.lower, pairs.map((pair) => pair.lower)),
    },
    limitMetres,
  };
}
