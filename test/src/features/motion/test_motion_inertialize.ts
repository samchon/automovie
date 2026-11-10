import {
  inertializeOffset,
  inertializePose,
  samplePoseVelocity,
} from "@automovie/engine";
import type { IAutoMoviePose } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Inertialized offsets are continuous at the cut, end exactly and never
 * overshoot; the pose form applies them per channel deterministically.
 *
 * Scenarios:
 * 1. Offsets of +1 and -1 with velocities toward zero, away from zero and
 *    zero, over 0.3 s: value and velocity at the cut equal x0 and v0, the
 *    offset is exactly zero from the decay time on, and the offset never
 *    changes sign on a 0.1 ms grid.
 * 2. A fast approach (x0 = 1, v0 = -40 per second) clamps the decay time to
 *    Bollo's -5 x0 / v0 = 0.125 s.
 * 3. A zero offset with a nonzero velocity leaves and returns to zero without
 *    crossing it.
 * 4. A pose cut from a knee at 40° rising 100°/s to a target knee at 10°
 *    falling 20°/s displays 40° at the cut, rises at 100°/s, equals the
 *    target from the decay time on, and two evaluations are bit-identical.
 * 5. A non-positive duration throws.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Evaluates the public offset and pose inertialization; a quintic with the wrong coefficients, a missing clamp or a pose channel taken from the wrong side fails.
 * @evidence contracts/development/testing.md#independent-expectations Boundary values come from the definition of inertialization (value x0 and slope v0 at the cut, zero at t1); the clamp bound is Bollo's published -5 x0 / v0; the no-overshoot property is a sign check; determinism is equality of two runs.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers both offset signs, velocities toward, away and zero, a clamped and an unclamped decay, a zero offset, the pose form and invalid input.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 scenarios and what each pins.
 */
export function test_motion_inertialize(): void {
  const t1: number = 0.3;
  for (const x0 of [1, -1])
    for (const v0 of [-3 * x0, 2 * x0, 0]) {
      const at0: inertializeOffset.IState = inertializeOffset(x0, v0, t1, 0);
      const h: number = 1e-7;
      const slope: number =
        (inertializeOffset(x0, v0, t1, h).value - at0.value) / h;
      TestValidator.predicate(
        `cut value and velocity (${x0}, ${v0})`,
        Math.abs(at0.value - x0) < 1e-12 &&
          Math.abs(at0.velocity - v0) < 1e-9 &&
          Math.abs(slope - v0) < 1e-4,
      );
      TestValidator.predicate(
        `exact end (${x0}, ${v0})`,
        inertializeOffset(x0, v0, t1, at0.duration).value === 0 &&
          inertializeOffset(x0, v0, t1, 1).value === 0,
      );
      let crossed: boolean = false;
      for (let t: number = 0; t < at0.duration; t += 1e-4)
        if (inertializeOffset(x0, v0, t1, t).value * x0 < 0) crossed = true;
      TestValidator.predicate(`no overshoot (${x0}, ${v0})`, !crossed);
    }
  TestValidator.predicate(
    "Bollo clamp",
    Math.abs(inertializeOffset(1, -40, t1, 0).duration - 0.125) < 1e-12,
  );
  const signs: Set<number> = new Set();
  for (let t: number = 1e-3; t < t1; t += 1e-3)
    signs.add(Math.sign(inertializeOffset(0, 2, t1, t).value));
  signs.delete(0);
  TestValidator.predicate("zero offset stays on one side", signs.size === 1);

  const knee = (deg: number): IAutoMoviePose => ({
    skeleton: "s",
    root: null,
    joints: [{ bone: "leftLowerLeg", flexion: deg, abduction: 0, twist: 0 }],
  });
  const source = samplePoseVelocity(
    (s: number): IAutoMoviePose => knee(40 + 100 * s),
    0,
  );
  const target = samplePoseVelocity(
    (s: number): IAutoMoviePose => knee(10 - 20 * s),
    0,
  );
  const blend = inertializePose(source, target, t1);
  const shown = (s: number): number =>
    blend(s, knee(10 - 20 * s)).joints.find((j) => j.bone === "leftLowerLeg")!
      .flexion!;
  const h: number = 1e-6;
  TestValidator.predicate("pose cut value", Math.abs(shown(0) - 40) < 1e-9);
  TestValidator.predicate(
    "pose cut velocity",
    Math.abs((shown(h) - shown(0)) / h - 100) < 1e-2,
  );
  TestValidator.predicate(
    "pose ends on target",
    shown(t1) === 10 - 20 * t1 && shown(0.5) === 0,
  );
  TestValidator.equals(
    "bit-identical",
    JSON.stringify(blend(0.1, knee(8))),
    JSON.stringify(inertializePose(source, target, t1)(0.1, knee(8))),
  );
  TestValidator.error("non-positive duration", (): unknown =>
    inertializeOffset(1, 0, 0, 0),
  );
}
