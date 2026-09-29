import type { HumanObservationView } from "@automovie/playground/src/human/observation/HumanObservationView";
import { placeHumanObservationCamera } from "@automovie/playground/src/human/observation/placeHumanObservationCamera";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * The review views stand on the figure's anatomical sides: the figure faces +Z,
 * so its left is +X. The table is the contract the body and face review hooks
 * share, so this pins each direction against hand-computed offsets.
 *
 * Scenarios:
 * 1. Each of the six horizon views at a distance of 2 m around the target
 *    (0.1, 1.2, -0.3): front +Z, left +X, back -Z, right -X, and the oblique
 *    views on the diagonals at 2/sqrt(2). The target is returned unchanged
 *    and every horizon view stays at the target's height.
 * 2. The pole views stand above and below the target at the same distance,
 *    a hair off the pole so the orbit's up vector stays defined.
 * 3. Negative twin: a left view is the mirror of the right view across the
 *    sagittal plane, not the same camera, and the front is not the back.
 * 4. The distance scales the offset linearly.
 * 5. Negative twin: a name outside the eight views throws with the name.
 */
export const test_human_observation_views = (): void => {
  const target: [number, number, number] = [0.1, 1.2, -0.3];
  const offset = (view: HumanObservationView, distance = 2) => {
    const placed = placeHumanObservationCamera(view, target, distance);
    TestValidator.equals(`${view} target`, placed.target, target);
    return placed.position.map((value, axis) => value - target[axis]);
  };
  const near = (actual: number[], expected: number[]): boolean =>
    actual.every((value, axis) => nclose(value, expected[axis], 1e-9));
  const d = 2 / Math.SQRT2;
  const horizon: [HumanObservationView, number[]][] = [
    ["front", [0, 0, 2]],
    ["left", [2, 0, 0]],
    ["back", [0, 0, -2]],
    ["right", [-2, 0, 0]],
    ["left-three-quarter", [d, 0, d]],
    ["right-three-quarter", [-d, 0, d]],
  ];
  for (const [view, expected] of horizon)
    TestValidator.predicate(
      `${view} stands ${expected.join(", ")} from the target`,
      near(offset(view), expected),
    );

  const top = offset("top");
  const bottom = offset("bottom");
  TestValidator.predicate(
    "top stands above the target",
    nclose(top[1], 2, 1e-4) && Math.hypot(top[0], top[2]) < 0.01,
  );
  TestValidator.predicate(
    "bottom stands below the target",
    nclose(bottom[1], -2, 1e-4) && Math.hypot(bottom[0], bottom[2]) < 0.01,
  );
  TestValidator.predicate(
    "the pole views keep the requested distance",
    nclose(Math.hypot(...top), 2, 1e-9) &&
      nclose(Math.hypot(...bottom), 2, 1e-9),
  );

  const left = offset("left");
  const right = offset("right");
  TestValidator.predicate(
    "left mirrors right across the sagittal plane",
    nclose(left[0], -right[0], 1e-9) && left[0] !== right[0],
  );
  TestValidator.predicate(
    "front is not back",
    !near(offset("front"), offset("back")),
  );
  let refusal = "";
  try {
    placeHumanObservationCamera("sideways" as never, target, 2);
  } catch (error) {
    refusal = (error as Error).message;
  }
  TestValidator.predicate("unknown view is refused by name", refusal.includes("sideways"));
  TestValidator.predicate(
    "the offset scales with the distance",
    near(offset("left-three-quarter", 4), offset("left-three-quarter").map((v) => 2 * v)),
  );
};
