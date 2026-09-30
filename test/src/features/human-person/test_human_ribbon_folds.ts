import { countHumanRibbonFolds } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * A ribbon triangle is folded when it faces against the skin at any corner.
 *
 * Every point is on the plane y = 0 and every corner normal is +Y, so a
 * triangle wound counterclockwise seen from +Y (its normal is +Y) agrees and
 * one wound clockwise opposes.
 *
 * Scenarios:
 * 1. The triangle (0,1,2) over (0,0,0), (1,0,0), (0,0,1): the edges (1,0,0) and
 *    (0,0,1) cross to (0,-1,0) and (0,0,1) x (1,0,0) style ordering makes the
 *    hand-derived normal -Y, so it is folded; its reverse (0,2,1) is not.
 * 2. Both together: one fold of two triangles.
 * 3. A triangle of three collinear points has no direction and is not counted,
 *    whatever the corner normals say.
 * 4. The widest gap is the longest edge of any triangle, here the hypotenuse
 *    sqrt(2) of the right triangle, and it is reported even for a folded one.
 * 5. An empty ribbon has no fold and no gap.
 */
export const test_human_ribbon_folds = (): void => {
  const points = [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 2, y: 0, z: 0 },
  ];
  const normals = [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0];
  // (1,0,0) x (0,0,1) = (0*1 - 0*0, 0*0 - 1*1, 0) = (0,-1,0): facing down
  const opposed = countHumanRibbonFolds([0, 1, 2], points, normals);
  TestValidator.equals("a triangle facing down is folded", opposed.folded, 1);
  TestValidator.predicate(
    "its widest gap is the hypotenuse",
    nclose(opposed.widestGap, Math.SQRT2, 1e-12),
  );
  TestValidator.equals(
    "the reversed triangle agrees with the skin",
    countHumanRibbonFolds([0, 2, 1], points, normals).folded,
    0,
  );
  TestValidator.equals(
    "one of two is folded",
    countHumanRibbonFolds([0, 1, 2, 0, 2, 1], points, normals).folded,
    1,
  );
  const flat = countHumanRibbonFolds([0, 1, 3], points, normals);
  TestValidator.predicate(
    "a triangle with no direction is not counted but its edges are measured",
    flat.folded === 0 && nclose(flat.widestGap, 2, 1e-12),
  );
  TestValidator.equals(
    "an empty ribbon has neither",
    countHumanRibbonFolds([], points, normals),
    { folded: 0, widestGap: 0 },
  );
};
