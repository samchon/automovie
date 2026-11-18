import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import { AutoMovieMotionHumanAuditContinuity } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The jump audit tests continuity, not speed: a fast but smooth stroke has
 * no jump, and a snap of one frame's travel does.
 *
 * A body is continuous in time, so over shorter and shorter intervals a
 * smooth path's displacements agree with their neighbours' to within its
 * acceleration times the interval squared, while a step keeps its size
 * (`AutoMovieMotionHumanAuditContinuity`). The fast stroke is a lunge's
 * sword point: 0.661 m in a minimum-jerk unit of 0.4 s, whose peak speed,
 * 1.875 times the mean, is 3.1 m/s, the elite's cited peak point speed in
 * the lunge (3.2 m/s, Chen et al. 2017, PLoS ONE) within the striking
 * family's 20 %.
 *
 * Scenarios, one joint centre on a 24 Hz grid over 1 s:
 * 1. The smooth stroke from 0.3 s: no jump over the audit's 5 mm, its speed
 *    read as the stroke's own.
 * 2. The same joint still, then stepping in one instant at 0.5 s by the
 *    stroke's largest travel over a frame: a jump of that size at 0.5 s.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public continuity audit on two synthetic motions; an audit that caps speed fails the smooth stroke, one that misses a step fails the snap.
 * @evidence contracts/development/testing.md#independent-expectations The minimum-jerk unit's peak is 1.875 times its mean; the step's size is the stroke's largest frame travel, computed from the formula, not from the audit.
 * @evidence contracts/development/testing.md#distinguishing-cases A fast smooth path and a step of the same travel.
 * @evidence contracts/development/testing.md#execution-ownership Two in-memory motions of one joint; no performance is planned.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the stroke's source and the two scenarios.
 */
export function test_human_motion_audit_continuity_fast(): void {
  const L: number = 0.661;
  const T: number = 0.4;
  const start: number = 0.3;
  const stroke = (t: number): number => {
    const u: number = Math.min(1, Math.max(0, (t - start) / T));
    return L * (10 * u ** 3 - 15 * u ** 4 + 6 * u ** 5);
  };
  const largest: number = Math.max(
    ...Array.from(
      { length: 24 },
      (_: unknown, k: number): number => stroke((k + 1) / 24) - stroke(k / 24),
    ),
  );
  const snap = (t: number): number => (t < 0.5 ? 0 : largest);
  const motion = (x: (t: number) => number): IAutoMovieMotionHumanAuditMotion =>
    ({
      duration: 1,
      bones: (
        _: string,
        seconds: number,
      ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
        new Map([
          [
            "rightHand",
            {
              bone: "rightHand",
              localRotation: { x: 0, y: 0, z: 0, w: 1 },
              worldPosition: { x: 0, y: 1, z: x(seconds) },
              worldRotation: { x: 0, y: 0, z: 0, w: 1 },
            },
          ],
        ]),
      segments: () => [],
    }) as unknown as IAutoMovieMotionHumanAuditMotion;
  const findings: string[] = [];
  const smooth = AutoMovieMotionHumanAuditContinuity.measure(
    motion(stroke),
    "a",
  );
  if (!(smooth.jump.value <= 0.005))
    findings.push(
      `the smooth stroke reads a jump of ${(smooth.jump.value * 1000).toFixed(1)} mm`,
    );
  if (!(Math.abs(smooth.speed.value - largest * 24) <= 1e-9))
    findings.push(
      `the smooth stroke reads ${smooth.speed.value} m/s, its frame speed ${largest * 24} expected`,
    );
  const stepped = AutoMovieMotionHumanAuditContinuity.measure(
    motion(snap),
    "a",
  );
  if (
    !(
      stepped.jump.value >= largest - 1e-9 &&
      Math.abs(stepped.jump.seconds - 0.5) <= 1 / 24
    )
  )
    findings.push(
      `the snap of ${(largest * 1000).toFixed(1)} mm reads a jump of ${(stepped.jump.value * 1000).toFixed(1)} mm at ${stepped.jump.seconds} s`,
    );
  TestValidator.equals(
    "a fast smooth stroke has no jump and a snap does",
    findings,
    [],
  );
}
