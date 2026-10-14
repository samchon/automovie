import { IAutoMoviePlanarPoint } from "@automovie/interface";

import { pointInPolygon } from "./pointInPolygon";
import { pointOnSegment } from "./pointOnSegment";
import { segmentsCross } from "./segmentsCross";

/**
 * Whether an inner polygon stays within an outer one, flush edges allowed.
 *
 * Boundary contact is allowed, so a void whose sill lies exactly
 * on the wall's own bottom edge is contained, while a void whose corner pokes
 * through the wall's side is not. Every inner corner must be inside or on the
 * outer ring by {@link pointInPolygon}, and no inner edge may properly cross an
 * outer edge by {@link segmentsCross} or leave through its vertices.
 *
 * Both polygons are closed rings in one planar frame and are assumed simple.
 * Outer vertices on an inner edge split it into intervals. Testing each
 * interval's midpoint also detects exits through vertices of a concave outer
 * ring, where neither boundary properly crosses the other.
 *
 * @param inner Ring that must stay inside, such as an opening's void hull.
 * @param outer Ring that must contain it, such as the host face outline.
 * @returns True when `inner` stays within `outer` by the rule above.
 *
 * @evidence contracts/common.md#principled-implementation For simple rings, ideal containment has contained vertices and no exterior boundary interval. Shared approximate predicates classify crossings/contacts and midpoint intervals under their finite-intermediate and scale premises; this is not an exact robust containment certificate. An empty inner ring passes vacuously; a nonempty inner ring with empty outer ring fails.
 * @evidence contracts/common.md#clear-and-simple-design Composes the shared `pointInPolygon` and `segmentsCross` predicates, so opening-in-face, panel fit, service and support-surface containment all apply one rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no void, wall or caller; flush edges pass through boundary-inclusive predicates, and vertex-only exits are judged by their exterior intervals rather than tolerated for a shape family.
 * @evidence contracts/common.md#meaningful-documentation The documentation states allowed contact, the shared frame and simple-ring premises, and why midpoint classification is needed for concave vertex contacts.
 * @evidence contracts/performance.md#efficient-algorithms For n inner and m outer edges, the usual scan costs O(n*m); sorting k vertex contacts and classifying their intervals adds O(k*log(k) + k*m) per touched inner edge, bounded by O(n*m*m) time and O(m) transient space. The midpoint scans resolve contacts that proper-crossing tests cannot classify.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure containment answer for one pair of rings; each validator asks once per void and face pair.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Each edge's contact parameters and midpoint records are local, bounded by the outer corner count, and released before the next edge; nothing is retained across calls.
 */
export const polygonInside: (
  inner: readonly IAutoMoviePlanarPoint[],
  outer: readonly IAutoMoviePlanarPoint[],
) => boolean = (
  inner: readonly IAutoMoviePlanarPoint[],
  outer: readonly IAutoMoviePlanarPoint[],
): boolean => {
  if (
    inner.some(
      (point: IAutoMoviePlanarPoint): boolean =>
        pointInPolygon(point, outer) === false,
    )
  )
    return false;
  for (let index: number = 0; index < inner.length; ++index) {
    const from: IAutoMoviePlanarPoint = inner[index]!;
    const to: IAutoMoviePlanarPoint = inner[(index + 1) % inner.length]!;
    const axis: "x" | "y" =
      Math.abs(to.x - from.x) >= Math.abs(to.y - from.y) ? "x" : "y";
    const delta: number = to[axis] - from[axis];
    const contacts: number[] = [0, 1];
    for (let other: number = 0; other < outer.length; ++other) {
      if (
        segmentsCross(
          from,
          to,
          outer[other]!,
          outer[(other + 1) % outer.length]!,
        )
      )
        return false;
      const point: IAutoMoviePlanarPoint = outer[other]!;
      if (delta !== 0 && pointOnSegment(point, from, to)) {
        const parameter: number = (point[axis] - from[axis]) / delta;
        if (parameter > 0 && parameter < 1) contacts.push(parameter);
      }
    }
    contacts.sort((left: number, right: number): number => left - right);
    for (let contact: number = 1; contact < contacts.length; ++contact) {
      if (contacts[contact] === contacts[contact - 1]) continue;
      const parameter: number =
        (contacts[contact]! + contacts[contact - 1]!) / 2;
      if (
        !pointInPolygon(
          {
            x: from.x + parameter * (to.x - from.x),
            y: from.y + parameter * (to.y - from.y),
          },
          outer,
        )
      )
        return false;
    }
  }
  return true;
};
