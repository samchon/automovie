import { IAutoMoviePlanarPoint } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { polygonInside } from "../../../../packages/engine/src/architecture/polygonInside";

/**
 * Containment includes boundary contact but refuses an edge leaving through
 * vertices of a concave host, even when every inner corner is contained.
 *
 * Scenarios:
 * 1. A rectangle crosses the exterior interval between two notch vertices.
 * 2. Reversing either winding, or placing the exiting edge endpoints exactly
 *    on the two notch vertices, preserves that refusal.
 * 3. A rectangle ending on the notch floor remains contained.
 * 4. Identical rings and a convex ring touching its host remain contained.
 * 5. An outside corner and a proper edge crossing are refused.
 * 6. Empty inner rings contain no offending points; nonempty rings cannot fit
 *    inside an empty host.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the production polygonInside predicate and distinguishes vertex-only exits, proper crossings, exterior corners and permitted boundary contact; a predicate checking only corners and proper crossings accepts scenario 1 incorrectly.
 * @evidence contracts/testing.md#independent-expectations The host is the rectangle [0,4] by [0,4] with a notch above the polyline (1,2)-(2,1)-(3,2). The interval from (1,2) to (3,2) contains exterior points, while the rectangle at y at most 1 is contained by coordinate inequalities, independently of the predicate.
 * @evidence contracts/testing.md#distinguishing-cases Covers concave vertex exits in both windings, a neighboring flush rectangle, identical and convex boundaries, exterior corners, proper crossings and empty rings. Building opening operation and panel placement remain owned by test_architecture_built_opening.
 * @evidence contracts/testing.md#execution-ownership This portable unit is discovered by its exported test_architecture_polygon_containment function and calls a pure planar predicate directly; it registers no dynamic cases and starts no consumer or host.
 */
export function test_architecture_polygon_containment(): void {
  const host: IAutoMoviePlanarPoint[] = [
    { x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 },
    { x: 3, y: 4 }, { x: 3, y: 2 }, { x: 2, y: 1 },
    { x: 1, y: 2 }, { x: 1, y: 4 }, { x: 0, y: 4 },
  ];
  const spanning: IAutoMoviePlanarPoint[] = [
    { x: 0.5, y: 0.5 }, { x: 3.5, y: 0.5 },
    { x: 3.5, y: 2 }, { x: 0.5, y: 2 },
  ];
  for (const inner of [spanning, [...spanning].reverse()])
    for (const outer of [host, [...host].reverse()])
      TestValidator.equals("vertex-only notch exit is refused", polygonInside(inner, outer), false);
  const endpoints: IAutoMoviePlanarPoint[] = [
    { x: 1, y: 0.5 }, { x: 3, y: 0.5 }, { x: 3, y: 2 }, { x: 1, y: 2 },
  ];
  TestValidator.equals("notch vertices at inner endpoints still refuse", polygonInside(endpoints, host), false);
  const flush: IAutoMoviePlanarPoint[] = [
    { x: 0.5, y: 0.5 }, { x: 3.5, y: 0.5 },
    { x: 3.5, y: 1 }, { x: 0.5, y: 1 },
  ];
  TestValidator.equals("notch-floor contact is contained", polygonInside(flush, host), true);
  TestValidator.equals("identical concave rings are contained", polygonInside(host, host), true);
  const square: IAutoMoviePlanarPoint[] = [
    { x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 },
  ];
  TestValidator.equals("convex boundary contact is contained", polygonInside(spanning, square), true);
  const exterior: IAutoMoviePlanarPoint[] = [{ x: -1, y: 0 }, ...flush.slice(1)];
  TestValidator.equals("outside corner is refused", polygonInside(exterior, host), false);
  const crossing: IAutoMoviePlanarPoint[] = spanning.map(
    (point: IAutoMoviePlanarPoint): IAutoMoviePlanarPoint => ({ x: point.x, y: point.y + 0.1 }),
  );
  TestValidator.equals("proper notch crossing is refused", polygonInside(crossing, host), false);
  TestValidator.equals("empty inner ring has no exterior point", polygonInside([], host), true);
  TestValidator.equals("empty host cannot contain a nonempty ring", polygonInside(flush, []), false);
}
