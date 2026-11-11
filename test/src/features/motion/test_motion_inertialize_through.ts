import {
  inertializeOffset,
  inertializePose,
  samplePoseVelocity,
} from "@automovie/engine";
import type { IAutoMoviePose } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * An offset let through its target keeps its rate at the cut with a bounded
 * acceleration, where the clamped one stops within milliseconds.
 *
 * Scenarios:
 * 1. An offset of 0.01 closing at 24 per second over 0.3 s: clamped, the
 *    decay time is 5 x0 / |v0|, about 2 ms; let through, it is the whole
 *    0.3 s, and the value and the slope at the cut are still x0 and v0.
 * 2. Let through, the second difference at the cut is the quintic's
 *    -(8 v0 t1 + 20 x0) / t1^2, about 638 per second squared, against the
 *    clamped 4 v0^2 / (5 x0), 46080.
 * 3. It crosses zero, by no more than the rate in excess of 5 x0 / t1 times
 *    256 t1 / 3125, and is exactly zero from 0.3 s on.
 * 4. An offset heading away from zero is the same either way.
 * 5. A pose cut from a knee at 10.01° falling 24°/s to a knee held at 10°
 *    shows the target 10 ms later when clamped, and more than 0.1° past it
 *    when let through.
 */
export function test_motion_inertialize_through(): void {
  const close = (a: number, b: number, e: number): boolean =>
    Math.abs(a - b) <= e;
  const x0: number = 0.01;
  const v0: number = -24;
  const t1: number = 0.3;
  const through = (t: number): number =>
    inertializeOffset(x0, v0, t1, t, true).value;
  const h: number = 1e-5;
  TestValidator.predicate(
    "decay time, clamped and let through",
    close(inertializeOffset(x0, v0, t1, 0).duration, (5 * x0) / -v0, 1e-15) &&
      inertializeOffset(x0, v0, t1, 0, true).duration === t1,
  );
  TestValidator.predicate(
    "cut value and velocity",
    close(through(0), x0, 1e-15) &&
      close(inertializeOffset(x0, v0, t1, 0, true).velocity, v0, 1e-9) &&
      close((through(h) - through(0)) / h, v0, 1e-2),
  );
  TestValidator.predicate(
    "bounded acceleration at the cut",
    close(
      (through(2 * h) - 2 * through(h) + through(0)) / (h * h),
      -(8 * v0 * t1 + 20 * x0) / (t1 * t1),
      5,
    ),
  );

  let least: number = 0;
  for (let t: number = 0; t < t1; t += 1e-4)
    least = Math.min(least, through(t));
  const bound: number = ((-v0 - (5 * x0) / t1) * 256 * t1) / 3125;
  TestValidator.predicate(
    "crosses zero within the lobe's bound and ends exactly",
    least < 0 && -least <= bound && through(t1) === 0 && through(1) === 0,
  );

  let same: boolean = true;
  for (let t: number = 0; t <= t1; t += 1e-2)
    same &&=
      inertializeOffset(x0, 3, t1, t, true).value ===
      inertializeOffset(x0, 3, t1, t).value;
  TestValidator.predicate("an offset heading away is unchanged", same);

  const knee = (deg: number): IAutoMoviePose => ({
    skeleton: "s",
    root: null,
    joints: [{ bone: "leftLowerLeg", flexion: deg, abduction: 0, twist: 0 }],
  });
  const source = samplePoseVelocity(
    (s: number): IAutoMoviePose => knee(10.01 - 24 * s),
    0,
  );
  const target = samplePoseVelocity((): IAutoMoviePose => knee(10), 0);
  const shown = (pass: boolean): number =>
    inertializePose(source, target, t1, pass)(0.01, knee(10)).joints.find(
      (j) => j.bone === "leftLowerLeg",
    )!.flexion!;
  TestValidator.predicate(
    "the pose form stops short or follows through",
    shown(false) === 10 && shown(true) < 9.9,
  );
}
