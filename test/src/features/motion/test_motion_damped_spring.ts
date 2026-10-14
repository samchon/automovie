import { dampedSpring } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * The 1-D damped spring used for secondary motion (tail/ear follow-through).
 * Pinned by hand-computed semi-implicit Euler: `v += (k·(target−x) − c·v)·dt; x
 * += v·dt`.
 *
 * Scenarios:
 *
 * 1. Resting exactly on the target with no velocity stays put (zero force).
 * 2. One step from below the target gains positive velocity and moves toward it
 *    (k=20, x=0→target 10, dt=0.1 ⇒ v=20, x=2).
 * 3. Pure damping (k=0) bleeds velocity: v=50, c=10, dt=0.1 ⇒ v=0, x unchanged.
 * 4. Iterating many steps converges onto the target and comes to rest.
 * 5. Each nonfinite scalar, negative coefficient and nonpositive timestep refuses.
 *
 * @evidence contracts/testing.md#behavioral-verification Advances the actual damped spring through resting, restoring-force, damping and 400-step settling cases, then requires named input refusals. Wrong update order, lost damping or accepting invalid integration inputs fails the retained observations.
 * @evidence contracts/testing.md#independent-expectations Semi-implicit Euler gives velocity 20 and value two for k=20, target ten and dt=.1; pure damping gives zero velocity for c=10, v=50 and dt=.1. The 400-step finite convergence check applies only to its chosen stable coefficients/timestep and does not prove stability for arbitrary parameters.
 * @evidence contracts/testing.md#distinguishing-cases Keeps exact rest, one restoring step, zero-stiffness damping, the original settling trajectory, six nonfinite scalar positions, both negative coefficients and zero/negative dt. Arithmetic overflow from extreme finite inputs and other timesteps are outside this entry.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns its state loop and refusal cases and invokes portable scalar integration with no consumer installation, native build, host startup or dynamic registration.
 */
export function test_motion_damped_spring(): void {
  // 1. at rest on target
  const a: ReturnType<typeof dampedSpring> = dampedSpring(5, 0, 5, { stiffness: 50, damping: 8 }, 0.1);
  TestValidator.predicate("rest value holds", nclose(a.value, 5));
  TestValidator.predicate("rest velocity holds", nclose(a.velocity, 0));

  // 2. pulled toward a higher target
  const b: ReturnType<typeof dampedSpring> = dampedSpring(0, 0, 10, { stiffness: 20, damping: 4 }, 0.1);
  TestValidator.predicate("velocity = k·Δ·dt", nclose(b.velocity, 20));
  TestValidator.predicate("value = v·dt", nclose(b.value, 2));

  // 3. pure damping kills velocity
  const c: ReturnType<typeof dampedSpring> = dampedSpring(0, 50, 0, { stiffness: 0, damping: 10 }, 0.1);
  TestValidator.predicate("damped velocity → 0", nclose(c.velocity, 0));
  TestValidator.predicate("value unchanged", nclose(c.value, 0));

  // 4. converges onto the target
  let s: ReturnType<typeof dampedSpring> = { value: 0, velocity: 0 };
  for (let i: number = 0; i < 400; ++i)
    s = dampedSpring(
      s.value,
      s.velocity,
      1,
      { stiffness: 120, damping: 20 },
      1 / 60,
    );
  TestValidator.predicate("converges to target", nclose(s.value, 1, 1e-3));
  TestValidator.predicate("settles to rest", nclose(s.velocity, 0, 1e-3));
  // 5. invalid scalar inputs reject before integration
  const invalidScalars: [string, () => ReturnType<typeof dampedSpring>][] = [
    [
      "current",
      (): ReturnType<typeof dampedSpring> => dampedSpring(Number.NaN, 0, 1, { stiffness: 10, damping: 2 }, 0.1),
    ],
    [
      "velocity",
      (): ReturnType<typeof dampedSpring> => dampedSpring(0, Infinity, 1, { stiffness: 10, damping: 2 }, 0.1),
    ],
    [
      "target",
      (): ReturnType<typeof dampedSpring> => dampedSpring(0, 0, -Infinity, { stiffness: 10, damping: 2 }, 0.1),
    ],
    [
      "stiffness",
      (): ReturnType<typeof dampedSpring> => dampedSpring(0, 0, 1, { stiffness: Number.NaN, damping: 2 }, 0.1),
    ],
    [
      "damping",
      (): ReturnType<typeof dampedSpring> => dampedSpring(0, 0, 1, { stiffness: 10, damping: Infinity }, 0.1),
    ],
    [
      "dt",
      (): ReturnType<typeof dampedSpring> => dampedSpring(0, 0, 1, { stiffness: 10, damping: 2 }, Number.NaN),
    ],
  ];
  for (const [name, task] of invalidScalars)
    TestValidator.predicate(`rejects non-finite ${name}`, throwsError(task, `spring ${name} must be finite`));

  TestValidator.predicate(
    "rejects negative stiffness",
    throwsError((): ReturnType<typeof dampedSpring> => dampedSpring(0, 0, 1, { stiffness: -1, damping: 2 }, 0.1), "spring stiffness must be non-negative"),
  );
  TestValidator.predicate(
    "rejects negative damping",
    throwsError((): ReturnType<typeof dampedSpring> => dampedSpring(0, 0, 1, { stiffness: 10, damping: -1 }, 0.1), "spring damping must be non-negative"),
  );
  for (const dt of [0, -0.1])
    TestValidator.predicate(
      `rejects non-positive dt ${dt}`,
      throwsError((): ReturnType<typeof dampedSpring> => dampedSpring(0, 0, 1, { stiffness: 10, damping: 2 }, dt), "spring dt must be positive"),
    );
}
