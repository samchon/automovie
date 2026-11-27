import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type { IAutoMovieSpringStep } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/** Rounding of a few products and sums. */
const ROUNDING: number = 1e-12;

/**
 * `dampedSpring` advances a one-dimensional damped spring by one step of
 * semi-implicit (symplectic) Euler: the velocity first, by the force `stiffness
 * (target - current) - damping velocity` over the step, then the position by
 * the new velocity (Hairer, Lubich and Wanner, Geometric Numerical Integration,
 * 2006, the symplectic Euler method).
 *
 * Each expectation is that one step worked by hand, so an explicit Euler step
 * (position by the old velocity), a sign error in the force or a damping
 * applied to the position fails.
 *
 * Scenarios:
 *
 * 1. From 1 at rest toward 0 with stiffness 4 and damping 4 over 0.1 s: the
 *    velocity becomes -0.4 and the value 0.96, where explicit Euler keeps 1.
 * 2. Damping alone (stiffness 0, the boundary) slows a velocity of 2 to 1 over 0.1
 *    s with damping 5, the value moving 0.1.
 * 3. At the target and at rest the spring stays.
 * 4. With neither stiffness nor damping the velocity holds and the value drifts by
 *    velocity times step.
 * 5. A negative stiffness or damping and a step of 0 or less are refused.
 */
export function test_engine_motion_damped_spring(): void {
  const is: (
    step: IAutoMovieSpringStep,
    value: number,
    velocity: number,
  ) => boolean = (
    step: IAutoMovieSpringStep,
    value: number,
    velocity: number,
  ): boolean =>
    nclose(step.value, value, ROUNDING) &&
    nclose(step.velocity, velocity, ROUNDING);

  TestValidator.predicate(
    "one symplectic step toward the target",
    is(AutoMovieEngineMotionSampling.dampedSpring(1, 0, 0, { stiffness: 4, damping: 4 }, 0.1), 0.96, -0.4),
  );
  TestValidator.predicate(
    "damping alone slows the velocity",
    is(AutoMovieEngineMotionSampling.dampedSpring(0, 2, 0, { stiffness: 0, damping: 5 }, 0.1), 0.1, 1),
  );
  TestValidator.predicate(
    "rest at the target stays",
    is(AutoMovieEngineMotionSampling.dampedSpring(3, 0, 3, { stiffness: 9, damping: 2 }, 0.05), 3, 0),
  );
  TestValidator.predicate(
    "no force keeps the velocity",
    is(AutoMovieEngineMotionSampling.dampedSpring(1, 3, 0, { stiffness: 0, damping: 0 }, 0.5), 2.5, 3),
  );
  for (const [label, task] of [
    [
      "a negative stiffness",
      () => AutoMovieEngineMotionSampling.dampedSpring(1, 0, 0, { stiffness: -1, damping: 0 }, 0.1),
    ],
    [
      "a negative damping",
      () => AutoMovieEngineMotionSampling.dampedSpring(1, 0, 0, { stiffness: 1, damping: -1 }, 0.1),
    ],
    [
      "a step of 0",
      () => AutoMovieEngineMotionSampling.dampedSpring(1, 0, 0, { stiffness: 1, damping: 1 }, 0),
    ],
    [
      "a negative step",
      () => AutoMovieEngineMotionSampling.dampedSpring(1, 0, 0, { stiffness: 1, damping: 1 }, -0.1),
    ],
  ] as const)
    TestValidator.predicate(`${label} is refused`, throwsError(task));
}
