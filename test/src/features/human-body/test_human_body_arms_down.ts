import {
  createHumanBodyBasisBuilder,
  solveHumanBodyArmsDown,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyTrunkArmFixture } from "../internal/humanBodyTrunkArmFixture";
import { throwsError } from "../internal/predicates";

/**
 * The inner edge of the left arm block enters a trunk block
 * `|x| <= half`, `2.0 <= y <= 2.85` when, for some point of it, both
 * `x < half` and `y < 2.85`; the arm hangs from (0.25, 3) at total elevation
 * `e` in the lateral plane, so its inner edge is
 * `(0.25 + s sin e - 0.02 cos e, 3 - s cos e - 0.02 sin e)`, `0 <= s <= 0.3`.
 */
const touches = (e: number, half: number): boolean => {
  const r = (e * Math.PI) / 180;
  for (let s = 0; s <= 0.3; s += 1e-4) {
    const x = 0.25 + s * Math.sin(r) - 0.02 * Math.cos(r);
    const y = 3 - s * Math.cos(r) - 0.02 * Math.sin(r);
    if (x < half && y < 2.85 && y > 2.0) return true;
  }
  return false;
};

/**
 * Arms down lowers each arm in the lateral plane to the lowest elevation at
 * which its chain crosses nothing it did not cross at rest, on the body it
 * is given.
 *
 * The fixture (`humanBodyTrunkArmFixture`) replaces the shoulder fixture's skin with two closed block
 * surfaces: a trunk bound to `upperChest` (`|x| <= half`, y 2.0 to 2.85, `|z| <= 0.1`) and a
 * left arm block bound to `leftUpperArm`, 0.3 m long and 0.04 m thick, laid
 * along the measured A-pose (elevation 45) from a shoulder at (0.25, 3). The
 * right arm carries no skin. First contact is found independently by
 * walking the block's inner edge (`touches`).
 *
 * Scenarios:
 * 1. With `half = 0.24` the left arm's result lies within one degree above
 *    the walked first-contact elevation (about 3.8 degrees); the skinless
 *    right arm hangs at 0. Both goals are lateral with no axial rotation,
 *    both elbows are straight, and a document's other joints survive.
 * 2. With `half = 0.2` the trunk never meets the arm: both arms hang at 0.
 * 3. A document the builder refuses (girdle flexion past its range) refuses
 *    here with the builder's reason.
 */
export const test_human_body_arms_down = (): void => {
  const basis = humanBodyTrunkArmFixture(0.24);
  const build = createHumanBodyBasisBuilder(basis);
  const document = {
    id: "arms",
    name: "Arms",
    basis: basis.id,
    shape: {},
    pose: [
      { bone: "spine" as const, flexion: 5, abduction: null, twist: null },
    ],
  };
  const solved = solveHumanBodyArmsDown(basis, build, document);
  let first = 0;
  let last = 45;
  while (last - first > 1e-3) {
    const middle = (first + last) / 2;
    if (touches(middle, 0.24)) first = middle;
    else last = middle;
  }
  const left = solved.shoulders!.find((one) => one.bone === "leftUpperArm")!;
  const right = solved.shoulders!.find((one) => one.bone === "rightUpperArm")!;
  TestValidator.predicate(
    `left arm rests within a degree above first contact (${last.toFixed(2)})`,
    left.elevation >= last - 1e-3 && left.elevation <= last + 1,
  );
  TestValidator.equals("the skinless right arm hangs", right.elevation, 0);
  TestValidator.equals(
    "lateral goals without axial rotation",
    solved.shoulders!.map((one) => [one.plane, one.axialRotation]),
    [
      [0, 0],
      [0, 0],
    ],
  );
  TestValidator.equals(
    "straight elbows and the document's other joints",
    solved.pose,
    [
      { bone: "spine", flexion: 5, abduction: null, twist: null },
      { bone: "leftLowerArm", flexion: 0, abduction: null, twist: null },
      { bone: "rightLowerArm", flexion: 0, abduction: null, twist: null },
    ],
  );

  const narrow = humanBodyTrunkArmFixture(0.2);
  const clear = solveHumanBodyArmsDown(
    narrow,
    createHumanBodyBasisBuilder(narrow),
    { ...document, basis: narrow.id },
  );
  TestValidator.equals(
    "a trunk that never meets the arm lets both hang",
    clear.shoulders!.map((one) => one.elevation),
    [0, 0],
  );

  TestValidator.predicate(
    "a refused document refuses the preset",
    throwsError(
      () =>
        solveHumanBodyArmsDown(basis, build, {
          ...document,
          pose: [
            { bone: "leftShoulder", flexion: 90, abduction: null, twist: null },
          ],
        }),
      "clinical ranges",
    ),
  );
};
