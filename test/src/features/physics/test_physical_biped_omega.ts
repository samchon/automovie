import {
  physicalBalanceStance,
  physicalBipedPlan,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalRecoveryState,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalBalanceReplay } from "../internal/PhysicalBalanceReplay";

/**
 * The biped's pendulum rate is IHMC's omega0, a per-robot constant sqrt(g /
 * z0) at its nominal height, set once and never updated (201903
 * `HighLevelHumanoidControllerToolbox` l.204, `WalkingControllerParameters`
 * l.45-51), z0 here the authored centre of mass's height over the floor:
 *
 * 1. On a recorded human's first update, the rate is sqrt(g / z0) with z0 from
 *    the authored segments' centres of mass, and the plan stores it.
 * 2. A state that holds a rate keeps it: the plan neither recomputes nor
 *    replaces it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and its source.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the biped plan on recorded readings and reads the state it returns.
 * @evidence contracts/development/testing.md#independent-expectations z0 is summed in the test from each segment's authored pose and centre of mass; the held rate is a value no body has.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates a rate computed on the first update from one held from before.
 * @evidence contracts/development/testing.md#execution-ownership Pure computation over a replay fixture; no native world, viewer or simulation run.
 */
export function test_physical_biped_omega(): void {
  const failures: string[] = [];
  const fixture: PhysicalBalanceReplay.IFixture = PhysicalBalanceReplay.load(
    PhysicalBalanceReplay.list().find(
      (name: string): boolean =>
        PhysicalBalanceReplay.load(name).case === "human:p0:z",
    )!,
  );
  const built: IAutoMoviePhysicalProfile = PhysicalBalanceReplay.profile(
    fixture.subject,
  );
  const record: PhysicalBalanceReplay.IRecord = fixture.records.find(
    (candidate: PhysicalBalanceReplay.IRecord): boolean =>
      candidate.kind === "advance",
  )!;
  const { sense, state } = PhysicalBalanceReplay.sense(fixture, record, built);
  const { omega: _held, ...first } = state;
  void _held;

  // 1. The first update's rate.
  const height: number =
    built.segments.reduce((sum: number, segment): number => {
      const target = sense.targets[segment.bone]!;
      const q = target.rotation;
      const c = segment.centerOfMass;
      const y: number =
        target.position.y +
        2 * (q.x * q.y + q.w * q.z) * c.x +
        (1 - 2 * (q.x * q.x + q.z * q.z)) * c.y +
        2 * (q.y * q.z - q.w * q.x) * c.z;
      return sum + (segment.mass / built.mass) * y;
    }, 0) - sense.floor;
  const expected: number = Math.sqrt(sense.gravity / height);
  const run = (
    given: IAutoMoviePhysicalRecoveryState,
  ): IAutoMoviePhysicalRecoveryState =>
    physicalBipedPlan({
      state: given,
      sense,
      stance: physicalBalanceStance({ state: given, sense }),
    }).state;
  const computed: number | undefined = run(first).omega;
  if (computed === undefined || !(Math.abs(computed - expected) < 1e-9))
    failures.push(`first update: omega ${computed}, not ${expected}`);

  // 2. A held rate is kept.
  const kept: number | undefined = run({ ...first, omega: 2.5 }).omega;
  if (kept !== 2.5) failures.push(`held: omega became ${kept}`);
  TestValidator.equals("biped omega", failures, []);
}
