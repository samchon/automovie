import {
  carriedAcceleration,
  carriedRate,
  dampedSpring,
  inertializeOffset,
  inertializePose,
  samplePoseVelocity,
} from "@automovie/engine";
import type { IAutoMoviePose } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../../features/internal/nclose";
import { throwsError } from "../../../../features/internal/throwsError";

/**
 * A critically damped oscillator approaches rest and a closing offset preserves its entry tangent.
 *
 * Scenarios:
 * 1. Compare the damped response and the closing offset with the prescribed continuous law.
 * 2. Measure the Hermite rate and acceleration bases at both cuts, outside their interval and at the analytically determined extrema.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A critically damped oscillator approaches rest and a closing offset preserves its entry tangent.
 * @evidence contracts/development/testing.md#independent-expectations The critical solution from unit displacement and zero velocity is (1+2t) exp(-2t); one millisecond first-order steps admit two millimetres of error.
 * @evidence contracts/development/testing.md#distinguishing-cases Boundary and interior inputs distinguish the two behaviors.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_spring_response(): void {
  const knee = (angle: number): IAutoMoviePose => ({
    skeleton: "knee",
    root: null,
    joints: [{ bone: "leftLowerLeg", flexion: angle, abduction: 0, twist: 0 }],
  });
  const target = (t: number): IAutoMoviePose => knee(10 - 20 * t);
  const source = samplePoseVelocity((t) => knee(40 + 100 * t), 0);
  const blend = inertializePose(source, samplePoseVelocity(target, 0), 0.3);
  const read = (t: number): number => blend(t, target(t)).joints[0]!.flexion!;
  TestValidator.predicate(
    "moving pose joins the source tangent before tracking the target",
    nclose(read(0), 40, 1e-9) &&
      nclose((read(1e-6) - read(0)) / 1e-6, 100, 1e-2) &&
      read(0.3) === 4 &&
      read(0.5) === 0,
  );
  const passing = samplePoseVelocity((t) => knee(10.01 - 24 * t), 0);
  const fixed = samplePoseVelocity(() => knee(10), 0);
  TestValidator.predicate(
    "pass-through mode crosses the target pose",
    inertializePose(passing, fixed, 0.3, false)(0.01, knee(10)).joints[0]!
      .flexion === 10 &&
      inertializePose(passing, fixed, 0.3, true)(0.01, knee(10)).joints[0]!
        .flexion! < 9.9,
  );
  TestValidator.predicate(
    "refuses nonpositive decay",
    throwsError(() => inertializeOffset(1, 0, 0, 0)),
  );
  const initialOffset: number = 0.01,
    velocity: number = -24,
    decay: number = 0.3;
  const clampTime: number = (-5 * initialOffset) / velocity;
  const allowed = (time: number) =>
    inertializeOffset(initialOffset, velocity, decay, time, true);
  TestValidator.predicate(
    "clamped and pass-through decay durations",
    nclose(
      inertializeOffset(initialOffset, velocity, decay, 0).duration,
      clampTime,
      1e-15,
    ) && allowed(0).duration === decay,
  );
  const lobe = allowed(decay / 5).value,
    bound = ((-velocity - (5 * initialOffset) / decay) * 256 * decay) / 3125;
  TestValidator.predicate(
    "overshoot crosses zero inside the Hermite bound",
    lobe < 0 && -lobe <= bound && allowed(decay).value === 0,
  );
  TestValidator.predicate(
    "zero offset can carry a rate",
    inertializeOffset(0, 1, decay, decay / 5).value > 0 &&
      inertializeOffset(0, 1, decay, decay).value === 0,
  );
  const duration: number = 0.4;
  for (const basis of [carriedRate, carriedAcceleration]) {
    for (const time of [-duration, 0, duration, 2 * duration])
      TestValidator.predicate(
        "no carried offset outside the open interval",
        nclose(basis(duration, time), 0, 1e-15),
      );
    TestValidator.predicate(
      "duration must be positive",
      throwsError(() => basis(0, duration)),
    );
    TestValidator.predicate(
      "elapsed seconds must be finite",
      throwsError(() => basis(duration, NaN)),
    );
  }
  const h: number = 1e-5;
  TestValidator.predicate(
    "unit entry rate and zero exit rate",
    nclose(carriedRate(duration, h) / h, 1, 1e-6) &&
      nclose(carriedRate(duration, duration - h) / h, 0, 1e-6),
  );
  for (const [time, curvature] of [
    [h, 1],
    [duration - h, 0],
  ] as const) {
    const secondDifference: number =
      (carriedAcceleration(duration, time + h) -
        2 * carriedAcceleration(duration, time) +
        carriedAcceleration(duration, time - h)) /
      (h * h);
    TestValidator.predicate(
      "unit entry acceleration and zero exit acceleration",
      nclose(secondDifference, curvature, 1e-2),
    );
    TestValidator.predicate(
      "zero endpoint rate for the acceleration basis",
      nclose(
        (carriedAcceleration(duration, time + h) -
          carriedAcceleration(duration, time - h)) /
          (2 * h),
        0,
        time === h ? 1e-3 : 1e-6,
      ),
    );
    const rateCurvature: number =
      (carriedRate(duration, time + h) -
        2 * carriedRate(duration, time) +
        carriedRate(duration, time - h)) /
      (h * h);
    TestValidator.predicate(
      "no carried acceleration in the rate basis",
      nclose(rateCurvature, 0, 1e-2),
    );
  }
  TestValidator.predicate(
    "rate peak at one third",
    nclose(carriedRate.PEAK, 16 / 81, 1e-15) &&
      nclose(carriedRate(duration, duration / 3), (duration * 16) / 81, 1e-12),
  );
  TestValidator.predicate(
    "acceleration peak at two fifths",
    nclose(carriedAcceleration.PEAK, 54 / 3125, 1e-15) &&
      nclose(
        carriedAcceleration(duration, (2 * duration) / 5),
        (duration ** 2 * 54) / 3125,
        1e-12,
      ),
  );
  const entry = inertializeOffset(1, -2, 1, 0);
  const smooth = (u: number): number => u ** 3 * (10 - 15 * u + 6 * u * u);
  const reach = (t: number): number =>
    0.3 * smooth(t / 0.5) + 1.2 * carriedRate(0.5, t);
  const descent = (t: number): number =>
    0.02 * smooth(t / 0.25) + 3 * carriedAcceleration(0.25, 0.25 - t);
  TestValidator.predicate(
    "joined reach carries the entering speed",
    nclose((reach(h) - reach(0)) / h, 1.2, 1e-3) &&
      nclose(reach(0.5), 0.3, 1e-12),
  );
  TestValidator.predicate(
    "reversed basis meets a stationary accelerating goal",
    nclose(descent(0.25), 0.02, 1e-12) &&
      nclose((descent(0.25) - descent(0.25 - h)) / h, 0, 1e-3) &&
      nclose(
        (descent(0.25) - 2 * descent(0.25 - h) + descent(0.25 - 2 * h)) /
          (h * h),
        3,
        2e-2,
      ),
  );
  for (const u of [1 / 5, 1 / 2, 4 / 5]) {
    TestValidator.predicate(
      "interior rate profile",
      nclose(
        carriedRate(duration, u * duration),
        duration * u * (1 - u) ** 3 * (1 + 3 * u),
        1e-12,
      ),
    );
    TestValidator.predicate(
      "interior acceleration profile",
      nclose(
        carriedAcceleration(duration, u * duration),
        (duration ** 2 * u ** 2 * (1 - u) ** 3) / 2,
        1e-12,
      ),
    );
  }
  const elapsed: number = 1e-6;
  TestValidator.predicate(
    "entry value and tangent",
    nclose(entry.value, 1) &&
      nclose(
        (inertializeOffset(1, -2, 1, elapsed).value - entry.value) / elapsed,
        -2,
        1e-4,
      ),
  );
  const settled = inertializeOffset(1, -2, 1, 2);
  TestValidator.predicate(
    "settled offset",
    nclose(settled.value, 0) && nclose(settled.velocity, 0),
  );
  let state = dampedSpring(1, 0, 0, { stiffness: 4, damping: 4 }, 0.001);
  for (let i = 1; i < 1000; i++)
    state = dampedSpring(
      state.value,
      state.velocity,
      0,
      { stiffness: 4, damping: 4 },
      0.001,
    );
  TestValidator.predicate(
    "critical damping at one second",
    nclose(state.value, 3 * Math.exp(-2), 0.002) &&
      nclose(state.velocity, -4 * Math.exp(-2), 0.002),
  );
}
