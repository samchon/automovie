import { CutPoint } from "../geometry/CutPoint.ts";
import { Plane } from "../geometry/Plane.ts";
import { Polyline } from "../geometry/Polyline.ts";
import { Skin } from "../geometry/Skin.ts";
import { V2 } from "../geometry/V2.ts";
import { V3 } from "../geometry/V3.ts";
import { boundsOf } from "../geometry/boundsOf.ts";
import { cut } from "../geometry/cut.ts";
import { planeFrame } from "../geometry/planeFrame.ts";
import { signedArea } from "../geometry/signedArea.ts";
import { to2 } from "../geometry/to2.ts";
import { CriticalVertex } from "./CriticalVertex.ts";
import { ObservedLoop } from "./ObservedLoop.ts";
import { SectionEvent } from "./SectionEvent.ts";
import { SectionSlice } from "./SectionSlice.ts";
import { critical } from "./critical.ts";
import { observeLoop } from "./observeLoop.ts";
import { sourceNormals } from "./sourceNormals.ts";
import { sourceOrientation } from "./sourceOrientation.ts";

/**
 * Samples physical source sections and every PL critical-height bracket, preserving all incident contour relations.
 *
 * @evidence contracts/common.md#principled-implementation Fixed physical stations plus every PL critical-height bracket recover contour families and exact incident branch membership.
 * @evidence contracts/common.md#clear-and-simple-design One cache preserves observation identity at repeated planes; source addresses remain private and are omitted from events.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms O(number of planes times source mesh size) cuts plus critical-link preprocessing and stored section points.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeated work is reused only inside this operation where source identity is fixed; no cross-call or identity-dependent result cache exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caches and source-support sets live for one extraction call; the result retains only saved curves and physical event observations.
 */
export function observeSections(
  skin: Skin,
  stepMm: number,
): {
  nominalStepMm: number;
  eventBracketMm: number;
  bounds: { lo: V3; hi: V3 };
  events: SectionEvent[];
  slices: SectionSlice[];
} {
  if (skin.pose !== "native-A" || !(stepMm > 0 && Number.isFinite(stepMm)))
    throw new Error(
      "Source observation requires native-A and a finite positive millimetre step",
    );
  const bounds: ReturnType<typeof boundsOf> = boundsOf(skin.vertices);
  const normals: V3[] = sourceNormals(skin);
  const winding: ReturnType<typeof sourceOrientation> = sourceOrientation(skin);
  const cache: Map<number, SectionSlice> = new Map();
  const supports: Map<number, Set<number>[]> = new Map();
  const observe = (y: number): SectionSlice => {
    if (cache.has(y)) return cache.get(y)!;
    const plane: Plane = planeFrame([0, y, 0], [0, 1, 0], [0, 0, -1]);
    const contours: Polyline[] = cut(skin, plane);
    const closed: Polyline[] = contours.filter(
      (polyline: Polyline): boolean =>
        polyline.closed &&
        polyline.pts.length >= 3 &&
        Math.abs(
          signedArea(polyline.pts.map((p: CutPoint): V2 => to2(plane, p.p))),
        ) > 1e-18,
    );
    supports.set(
      y,
      closed.map(
        (polyline: Polyline): Set<number> =>
          new Set(polyline.pts.flatMap((p: CutPoint): number[] => [p.a, p.b])),
      ),
    );
    const loops: ObservedLoop[] = closed.map(
      (polyline: Polyline): ObservedLoop =>
        observeLoop(plane, polyline, winding(plane, polyline), normals),
    );
    const result: SectionSlice = {
      y,
      loops,
      open: contours.filter(
        (polyline: Polyline): boolean =>
          !polyline.closed && polyline.pts.length > 2,
      ).length,
    };
    cache.set(y, result);
    return result;
  };
  const levels: number[] = [bounds.lo[1] - 0.01, bounds.lo[1] + 0.01];
  for (let y: number = bounds.lo[1] + stepMm; y < bounds.hi[1]; y += stepMm)
    levels.push(y);
  levels.push(bounds.hi[1] - 0.01, bounds.hi[1] + 0.01);
  const slices: SectionSlice[] = levels.map(observe);
  const vertices: CriticalVertex[] = critical(skin);
  const heights: number[] = [
    ...new Set(skin.vertices.map((p: V3): number => p[1])),
  ].sort((a: number, b: number): number => a - b);
  const events: SectionEvent[] = [];
  for (const event of vertices) {
    let left: number = 0,
      right: number = heights.length;
    while (left < right) {
      const middle: number = (left + right) >> 1;
      if (heights[middle] < event.level) left = middle + 1;
      else right = middle;
    }
    const gap: number = Math.min(
      event.level - (heights[left - 1] ?? event.level - 1),
      (heights[left + 1] ?? event.level + 1) - event.level,
    );
    const epsilon: number = Math.min(0.001, gap / 4);
    if (!(epsilon > 1e-9))
      throw new Error(
        `Critical bracket below cutting precision at physical height ${event.level} mm`,
      );
    const below: SectionSlice = observe(event.level - epsilon),
      above: SectionSlice = observe(event.level + epsilon);
    slices.push(below, above);
    const membership = (slice: SectionSlice): SectionEvent["below"] =>
      slice.loops.flatMap(
        (loop: ObservedLoop, i: number): SectionEvent["below"] =>
          supports.get(slice.y)![i].has(event.vertex)
            ? [
                {
                  loop: i,
                  winding: loop.winding,
                  area: loop.area,
                  sourceSelfCrossings: loop.sourceSelfCrossings,
                },
              ]
            : [],
      );
    events.push({
      y: event.level,
      point: event.p,
      lowerLinkComponents: event.lower,
      upperLinkComponents: event.upper,
      equalHeightNeighbour: event.flat,
      manifoldLink: event.manifold,
      y0: below.y,
      y1: above.y,
      below: membership(below),
      above: membership(above),
      method:
        "Source PL-height links, physical bracketing and incident source-edge support; no source addresses are serialized.",
    });
  }
  // Retain the original count-change brackets for matching prior experiments; critical cuts add missed events.
  for (let i: number = 1; i < levels.length; i++) {
    let a: number = levels[i - 1],
      b: number = levels[i];
    const count: number = observe(a).loops.length;
    if (count === observe(b).loops.length) continue;
    while (b - a > 0.002) {
      const middle: number = (a + b) / 2;
      if (observe(middle).loops.length === count) a = middle;
      else b = middle;
    }
    slices.push(observe(a), observe(b));
  }
  return {
    nominalStepMm: stepMm,
    eventBracketMm: 0.002,
    bounds,
    events,
    slices: [
      ...new Map(
        slices.map((slice: SectionSlice): [number, SectionSlice] => [
          slice.y,
          slice,
        ]),
      ).values(),
    ].sort((a: SectionSlice, b: SectionSlice): number => a.y - b.y),
  };
}
