import { inertializeOffset, samplePoseVelocity } from "@automovie/engine";
import type { IAutoMoviePose, IAutoMoviePoseState } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/throwsError";

/**
 * A velocity read from continued samples (`near`) reads the motion, not the
 * resolution of the fits that pose it, and the tolerance those fits are
 * refined to keeps an inertialization's offset within `ROM_TOLERANCE`.
 *
 * Scenarios:
 * 1. A knee at `10 + 33.7 t` degrees whose shown pose is resolved to 0.01
 *    degree (the shown sample rounds it), and whose continued samples are
 *    exact: read after 0.4 s with `near`, the rate is 33.7 degrees per second
 *    within 1e-9 and the pose is the shown one; without `near` the rounding
 *    divided by the step reads 25 degrees per second.
 * 2. `tolerance(1e-3, 0.4)` is `0.01 * 1e-3 * 3125 / (8 * 256 * 0.4)`,
 *    3.814697265625e-5 degrees.
 * 3. The derivation holds at its worst: three samples off by that tolerance
 *    with alternating signs read a rate off by `4 tolerance / h`; two reads
 *    off so in opposite ways give an offset velocity error of
 *    `8 tolerance / h`, and the inertialized offset that error alone drives
 *    over 0.4 s peaks at `ROM_TOLERANCE`, 0.01 degree, within 1e-12.
 * 4. A non-positive step or decay throws.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public sampler with and without continued samples and the public tolerance and offset; a rate read from the shown samples, a pose read from the continued ones or a tolerance that lets the offset past its bound fails.
 * @evidence contracts/development/testing.md#independent-expectations The rate is the written slope, the tolerance is computed from its formula by hand, and the bound is `ROM_TOLERANCE` itself, reached through `inertializeOffset`, not through the formula.
 * @evidence contracts/development/testing.md#distinguishing-cases A rounded shown pose with and without continued samples, the tolerance's value, its worst case end to end and two refused inputs.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 scenarios and what each pins.
 */
export function test_motion_pose_velocity_near(): void {
  const knee =
    (round: boolean): ((s: number) => IAutoMoviePose) =>
    (s: number): IAutoMoviePose => ({
      skeleton: "s",
      root: null,
      joints: [
        {
          bone: "leftLowerLeg",
          flexion: round
            ? Math.round((10 + 33.7 * s) * 100) / 100
            : 10 + 33.7 * s,
          abduction: 0,
          twist: 0,
        },
      ],
    });
  const read = (near?: (s: number) => IAutoMoviePose): IAutoMoviePoseState =>
    samplePoseVelocity(knee(true), 0.4, 1e-3, "after", undefined, near);
  const continued: IAutoMoviePoseState = read(knee(false));
  const shown: IAutoMoviePoseState = read();
  TestValidator.predicate(
    `the continued read sees the motion (${continued.velocity.joints.get("leftLowerLeg")![0]})`,
    Math.abs(continued.velocity.joints.get("leftLowerLeg")![0] - 33.7) <=
      1e-9 &&
      continued.pose.joints[0]!.flexion === knee(true)(0.4).joints[0]!.flexion,
  );
  TestValidator.predicate(
    `the shown read sees the rounding (${shown.velocity.joints.get("leftLowerLeg")![0]})`,
    Math.abs(shown.velocity.joints.get("leftLowerLeg")![0] - 33.7) > 1,
  );

  const tolerance: number = samplePoseVelocity.tolerance(1e-3, 0.4);
  TestValidator.predicate(
    `the tolerance (${tolerance})`,
    Math.abs(tolerance - 3.814697265625e-5) <= 1e-18,
  );

  const h: number = 1e-3;
  const off =
    (sign: number): ((s: number) => IAutoMoviePose) =>
    (s: number): IAutoMoviePose => {
      const k: number = Math.round((s - 0.4) / h);
      return {
        skeleton: "s",
        root: null,
        joints: [
          {
            bone: "leftLowerLeg",
            flexion: 10 + sign * (k === 1 ? -tolerance : tolerance),
            abduction: 0,
            twist: 0,
          },
        ],
      };
    };
  const rate = (sign: number): number =>
    samplePoseVelocity(off(sign), 0.4, h, "after").velocity.joints.get(
      "leftLowerLeg",
    )![0];
  const worst: number = rate(-1);
  TestValidator.predicate(
    `one read is off by 4 tolerance / h (${worst})`,
    Math.abs(worst - (4 * tolerance) / h) <= 1e-9,
  );
  const offset: number = rate(-1) - rate(1);
  let peak: number = 0;
  for (let i: number = 0; i <= 4000; ++i)
    peak = Math.max(
      peak,
      Math.abs(inertializeOffset(0, offset, 0.4, (0.4 * i) / 4000, true).value),
    );
  TestValidator.predicate(
    `the offset that error drives peaks at ROM_TOLERANCE (${peak})`,
    Math.abs(peak - 0.01) <= 1e-12,
  );

  TestValidator.predicate(
    "a zero step",
    throwsError((): unknown => samplePoseVelocity.tolerance(0, 0.4)),
  );
  TestValidator.predicate(
    "a zero decay",
    throwsError((): unknown => samplePoseVelocity.tolerance(1e-3, 0)),
  );
}
