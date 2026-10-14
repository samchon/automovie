import {
  IAutoMovieOpeningProfile,
  IAutoMoviePlanarPoint,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { appendBuiltRegionDefects } from "../../../../packages/engine/src/architecture/appendBuiltRegionDefects";
import { builtOutlineIsClosed } from "../../../../packages/engine/src/architecture/builtOutlineIsClosed";
import { outlineHull } from "../../../../packages/engine/src/architecture/outlineHull";
import { pointInPolygon } from "../../../../packages/engine/src/architecture/pointInPolygon";
import { polygonInside } from "../../../../packages/engine/src/architecture/polygonInside";
import { ViolationCollector } from "@automovie/engine";

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
 * 7. A finite concave CCW profile with an inward arc retains a conservative
 *    hull containing the independently derived arc point and interior witness.
 * 8. Reversed winding preserves that bound; outward and two-arc zero-area
 *    chord rings retain their expanded bounds.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls polygonInside and the opening outlineHull, distinguishing vertex-only exits and permitted boundary contact. An admitted inward arc between concave corners must remain enclosed; translating its full edge inward creates an undersized hull and fails the actual arc/interior witness.
 * @evidence contracts/testing.md#independent-expectations The notch host excludes the interval (1,2)-(3,2) and contains y at most1. For the 2m chord/bulge0.5 arc, sagitta0.5 and radius1.25 give centre(1,-0.75), so x0.1 has y=sqrt(1.25^2-0.9^2)-0.75, below0.2; both this boundary and the interior point(0.1,0.2) must be in a conservative hull.
 * @evidence contracts/testing.md#distinguishing-cases Covers concave vertex exits in both windings, flush/identical/convex boundaries, exterior corners, crossings and empty rings, plus a simple positive-area arc profile whose offset hull is also simple. Opening operation and panel placement remain owned by test_architecture_built_opening.
 * @evidence contracts/testing.md#execution-ownership This portable unit is discovered by its exported test_architecture_polygon_containment function and calls a pure planar predicate directly; it registers no dynamic cases and starts no consumer or host.
 */
export function test_architecture_polygon_containment(): void {
  const host: IAutoMoviePlanarPoint[] = [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 4 },
    { x: 3, y: 4 },
    { x: 3, y: 2 },
    { x: 2, y: 1 },
    { x: 1, y: 2 },
    { x: 1, y: 4 },
    { x: 0, y: 4 },
  ];
  const spanning: IAutoMoviePlanarPoint[] = [
    { x: 0.5, y: 0.5 },
    { x: 3.5, y: 0.5 },
    { x: 3.5, y: 2 },
    { x: 0.5, y: 2 },
  ];
  for (const inner of [spanning, [...spanning].reverse()])
    for (const outer of [host, [...host].reverse()])
      TestValidator.equals(
        "vertex-only notch exit is refused",
        polygonInside(inner, outer),
        false,
      );
  const endpoints: IAutoMoviePlanarPoint[] = [
    { x: 1, y: 0.5 },
    { x: 3, y: 0.5 },
    { x: 3, y: 2 },
    { x: 1, y: 2 },
  ];
  TestValidator.equals(
    "notch vertices at inner endpoints still refuse",
    polygonInside(endpoints, host),
    false,
  );
  const flush: IAutoMoviePlanarPoint[] = [
    { x: 0.5, y: 0.5 },
    { x: 3.5, y: 0.5 },
    { x: 3.5, y: 1 },
    { x: 0.5, y: 1 },
  ];
  TestValidator.equals(
    "notch-floor contact is contained",
    polygonInside(flush, host),
    true,
  );
  TestValidator.equals(
    "identical concave rings are contained",
    polygonInside(host, host),
    true,
  );
  const square: IAutoMoviePlanarPoint[] = [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 4 },
    { x: 0, y: 4 },
  ];
  TestValidator.equals(
    "convex boundary contact is contained",
    polygonInside(spanning, square),
    true,
  );
  const exterior: IAutoMoviePlanarPoint[] = [
    { x: -1, y: 0 },
    ...flush.slice(1),
  ];
  TestValidator.equals(
    "outside corner is refused",
    polygonInside(exterior, host),
    false,
  );
  const crossing: IAutoMoviePlanarPoint[] = spanning.map(
    (point: IAutoMoviePlanarPoint): IAutoMoviePlanarPoint => ({
      x: point.x,
      y: point.y + 0.1,
    }),
  );
  TestValidator.equals(
    "proper notch crossing is refused",
    polygonInside(crossing, host),
    false,
  );
  TestValidator.equals(
    "empty inner ring has no exterior point",
    polygonInside([], host),
    true,
  );
  TestValidator.equals(
    "empty host cannot contain a nonempty ring",
    polygonInside(flush, []),
    false,
  );
  const profile: IAutoMovieOpeningProfile = {
    outline: [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: -1 },
      { x: 3, y: 2 },
      { x: -1, y: 2 },
      { x: -1, y: -1 },
    ],
    bulges: [0.5, 0, 0, 0, 0, 0],
  };
  const hull: IAutoMoviePlanarPoint[] = outlineHull(profile);
  const admitted: ViolationCollector = new ViolationCollector();
  builtOutlineIsClosed(
    profile.outline,
    2,
    "$input.outline",
    "opening outline",
    admitted,
  );
  appendBuiltRegionDefects(hull, "$input.outline", "opening outline", admitted);
  TestValidator.equals(
    "finite distinct profile and its simple hull pass region admission",
    admitted.items.length,
    0,
  );
  const arcPoint: IAutoMoviePlanarPoint = {
    x: 0.1,
    y: Math.sqrt(1.25 ** 2 - 0.9 ** 2) - 0.75,
  };
  TestValidator.equals(
    "conservative hull contains the actual inward arc",
    pointInPolygon(arcPoint, hull),
    true,
  );
  TestValidator.equals(
    "conservative hull contains void above the inward arc",
    pointInPolygon({ x: 0.1, y: 0.2 }, hull),
    true,
  );
  const reversed: IAutoMovieOpeningProfile = {
    outline: [...profile.outline].reverse(),
    bulges: [0, 0, 0, 0, -0.5, 0],
  };
  TestValidator.equals(
    "inward arc remains enclosed after winding and bulge reversal",
    pointInPolygon(arcPoint, outlineHull(reversed)),
    true,
  );
  const outward: IAutoMovieOpeningProfile = {
    outline: profile.outline,
    bulges: [-0.5, 0, 0, 0, 0, 0],
  };
  TestValidator.equals(
    "outward arc still uses an expanded conservative bound",
    pointInPolygon({ x: arcPoint.x, y: -arcPoint.y }, outlineHull(outward)),
    true,
  );
  const circle: IAutoMovieOpeningProfile = {
    outline: [
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ],
    bulges: [1, 1],
  };
  const circleHull: IAutoMoviePlanarPoint[] = outlineHull(circle);
  TestValidator.equals(
    "two half-turn arcs retain both radius-one extrema",
    pointInPolygon({ x: 0, y: 1 }, circleHull) &&
      pointInPolygon({ x: 0, y: -1 }, circleHull),
    true,
  );
}
