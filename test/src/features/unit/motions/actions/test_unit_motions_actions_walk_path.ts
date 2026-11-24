import { WalkPath } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** Rounding of a few sums, metres and degrees. */
const ROUNDING: number = 1e-12;

/**
 * `WalkPath` is a floor polyline by arc length: `at` the point at a length,
 * clamped to the ends; `nearest` the length of the point nearest a floor point,
 * the first on a tie; `heading` the chord's heading across a neighbourhood,
 * kept inside the path at its ends.
 *
 * Scenarios, an L from the origin 3 m along +Z and then 4 m along +X:
 *
 * 1. Its length is 7 m; 1.5 m along is (0, 0, 1.5), 5 m along (2, 0, 3), and
 *    lengths past either end clamp to them.
 * 2. The point (1, 0, 1) is nearest the first leg at 1 m; (2, 0, 5) is nearest the
 *    second leg at 5 m.
 * 3. The heading 1 m along is 0 (+Z), 6 m along is 90 (+X), and at the corner over
 *    0.5 m either side it is the 45-degree chord.
 */
export function test_unit_motions_actions_walk_path(): void {
  const path: WalkPath = new WalkPath([
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 3 },
    { x: 4, y: 0, z: 3 },
  ]);
  TestValidator.predicate(
    "by length",
    nclose(path.length, 7, ROUNDING) &&
      vclose(path.at(1.5), { x: 0, y: 0, z: 1.5 }, ROUNDING) &&
      vclose(path.at(5), { x: 2, y: 0, z: 3 }, ROUNDING) &&
      vclose(path.at(-1), { x: 0, y: 0, z: 0 }, ROUNDING) &&
      vclose(path.at(9), { x: 4, y: 0, z: 3 }, ROUNDING),
  );
  TestValidator.predicate(
    "nearest",
    nclose(path.nearest({ x: 1, y: 0, z: 1 }), 1, ROUNDING) &&
      nclose(path.nearest({ x: 2, y: 0, z: 5 }), 5, ROUNDING),
  );
  TestValidator.predicate(
    "headings",
    nclose(path.heading(1, 0.5), 0, ROUNDING) &&
      nclose(path.heading(6, 0.5), 90, ROUNDING) &&
      nclose(path.heading(3, 0.5), 45, ROUNDING) &&
      nclose(path.heading(0, 0.5), 0, ROUNDING),
  );
}
