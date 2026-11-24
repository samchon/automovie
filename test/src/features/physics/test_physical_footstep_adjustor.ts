import {
  physicalPlanarPolygon as Polygon,
  physicalFootstepAdjustor,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * The footstep adjustor moves a footstep into a capture region only when its
 * touchdown outline, shrunk to half about the footstep, misses the region, and
 * then to the region's boundary point nearest a point ten metres beyond the
 * region's centroid away from the support (IHMC 201903 `FootstepAdjustor`
 * l.68-166).
 *
 * Scenarios, the region the square [1, 2] x [-0.5, 0.5] and the support's
 * centroid at (-1, 0):
 *
 * 1. A footstep at the origin with a 0.2 m square outline misses the region and
 *    moves to (2, 0), the region's far edge along the line from the support
 *    through its centroid.
 * 2. A footstep at (0.97, 0), its half outline reaching x = 1.02 into the region,
 *    stays.
 * 3. A footstep at (0.93, 0), whose full outline reaches x = 1.03 into the region
 *    but whose half outline ends at x = 0.98, moves.
 * 4. An empty region moves nothing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the fixture and each scenario.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the adjustor and reads its position and flag.
 * @evidence contracts/development/testing.md#independent-expectations The far point (11.5, 0) projects to (2, 0) by the square's geometry; the half outline's reach is the footstep plus a quarter of the outline's width.
 * @evidence contracts/development/testing.md#distinguishing-cases An adjustor moving an overlapping step fails 2, one testing the full outline keeps scenario 3's step, one projecting the footstep itself lands at (1, 0) in scenario 1, and one moving on an empty region fails 4.
 * @evidence contracts/development/testing.md#execution-ownership Pure computation on in-memory polygons.
 */
export function test_physical_footstep_adjustor(): void {
  const region: Polygon.IPoint[] = Polygon.hull([
    { x: 1, y: -0.5 },
    { x: 2, y: -0.5 },
    { x: 2, y: 0.5 },
    { x: 1, y: 0.5 },
  ]);
  const outline = (x: number): Polygon.IPoint[] =>
    Polygon.hull([
      { x: x - 0.1, y: -0.1 },
      { x: x + 0.1, y: -0.1 },
      { x: x + 0.1, y: 0.1 },
      { x: x - 0.1, y: 0.1 },
    ]);
  const adjust = (
    x: number,
    within: readonly Polygon.IPoint[] = region,
  ): physicalFootstepAdjustor.IResult =>
    physicalFootstepAdjustor({
      position: { x, y: 0 },
      outline: outline(x),
      support: { x: -1, y: 0 },
      region: within,
    });

  const moved: physicalFootstepAdjustor.IResult = adjust(0);
  TestValidator.predicate(
    "far edge",
    moved.adjusted &&
      nclose(moved.position.x, 2, 1e-9) &&
      nclose(moved.position.y, 0, 1e-9),
  );
  TestValidator.equals("overlapping stays", adjust(0.97).adjusted, false);
  TestValidator.equals("half outline misses", adjust(0.93).adjusted, true);
  TestValidator.equals("empty region", adjust(0, []), {
    position: { x: 0, y: 0 },
    adjusted: false,
  });
}
