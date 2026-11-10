import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { StrikingAim } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * A strike's tracking predicts its target at contact, corrects online with
 * the visuomotor latency, follows predictable motion exactly and misses
 * motion that starts too late to be seen.
 *
 * Scenarios:
 * 1. Observations start at the launch, step one frame, and stop at the last
 *    second whose correction still lasts its shortest duration.
 * 2. A still target: the plan is its point plus the offset and every
 *    correction is zero.
 * 3. A target moving at constant velocity: the launch prediction is already
 *    its point at contact, and the corrections are zero.
 * 4. A target that jumps two frames before the last observation: the goal
 *    after every correction equals its new point.
 * 5. A target that starts moving after the last observation: the goal stays
 *    where it was, so the strike lands on its committed line.
 * 6. Causality: the units started by a second read the target only at
 *    seconds at or before it less the latency.
 * 7. A contact before the launch throws.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the tracker's plan, units and goal; a prediction without velocity, a correction without latency, an observation past the cut-off or a look-ahead read fails.
 * @evidence contracts/development/testing.md#independent-expectations Linear motion is predicted exactly by first-order extrapolation; the sum of the corrections telescopes to the last prediction minus the first; the cut-off is impact minus latency minus the shortest unit.
 * @evidence contracts/development/testing.md#distinguishing-cases Still, uniformly moving, jumping early and moving late targets, and the causal read bound.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 7 scenarios and what each pins.
 */
export function test_motion_striking_aim(): void {
  const timing: StrikingAim.ITiming = {
    launch: 1,
    impact: 1.4,
    latency: 0.11,
    step: 1 / 24,
    shortest: 0.04,
  };
  const near = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    e: number = 1e-9,
  ): boolean => Vector3.length(Vector3.subtract(a, b)) <= e;
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

  const times: number[] = StrikingAim.observations(timing);
  const last: number = times.at(-1)!;
  TestValidator.predicate(
    "observation grid",
    times[0] === 1 &&
      last <= 1.4 - 0.11 - 0.04 + 1e-9 &&
      last + 1 / 24 > 1.4 - 0.11 - 0.04 &&
      times.every(
        (t: number, i: number): boolean =>
          i === 0 || Math.abs(t - times[i - 1]! - 1 / 24) < 1e-9,
      ),
  );

  const offset: IAutoMovieVector3 = { x: 0.01, y: -0.02, z: 0 };
  const still = StrikingAim.track(
    (): IAutoMovieVector3 => ({ x: 0, y: 1.6, z: 1 }),
    timing,
    offset,
  );
  TestValidator.predicate(
    "still target",
    near(still.planned, { x: 0.01, y: 1.58, z: 1 }) &&
      still.units(2).every((u): boolean => near(u.displacement, zero)) &&
      near(still.goal(2), still.planned),
  );

  const v: IAutoMovieVector3 = { x: 0.3, y: 0, z: -0.2 };
  const moving = (t: number): IAutoMovieVector3 =>
    Vector3.add({ x: 0, y: 1.6, z: 1 }, Vector3.scale(v, t));
  const linear = StrikingAim.track(moving, timing, zero);
  TestValidator.predicate(
    "constant velocity is met",
    near(linear.planned, moving(1.4), 1e-9) &&
      linear.units(2).every((u): boolean => near(u.displacement, zero, 1e-9)),
  );

  const jump: number = times.at(-3)! - 1e-6;
  const jumping = (t: number): IAutoMovieVector3 =>
    t < jump ? { x: 0, y: 1.6, z: 1 } : { x: 0.1, y: 1.6, z: 1 };
  const early = StrikingAim.track(jumping, timing, zero);
  TestValidator.predicate(
    "early jump is followed",
    near(early.goal(2), { x: 0.1, y: 1.6, z: 1 }, 1e-9),
  );

  const late = (t: number): IAutoMovieVector3 =>
    t <= last + 1e-6 ? { x: 0, y: 1.6, z: 1 } : { x: 0.2, y: 1.6, z: 1 };
  const missed = StrikingAim.track(late, timing, zero);
  TestValidator.predicate(
    "late motion is not seen",
    near(missed.goal(2), { x: 0, y: 1.6, z: 1 }),
  );

  let latest: number = -Infinity;
  const spy = StrikingAim.track(
    (t: number): IAutoMovieVector3 => {
      latest = Math.max(latest, t);
      return moving(t);
    },
    timing,
    zero,
  );
  for (const s of [1.05, 1.2, 1.3]) {
    latest = -Infinity;
    spy.units(s);
    TestValidator.predicate(
      `reads at or before ${s} less the latency`,
      latest <= s - timing.latency + 1e-9,
    );
  }

  TestValidator.error("contact before launch", (): unknown =>
    StrikingAim.observations({ ...timing, impact: 0.5 }),
  );
}
