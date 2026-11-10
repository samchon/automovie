import {
  HumanBalance,
  type IHumanBody,
  type IHumanPosture,
  createHumanBody,
  gesture,
  stand,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { MotionBodies } from "../../../../packages/motions/src/executable/MotionBodies";

/**
 * The balance search puts the engine's whole-body centre of mass over the
 * feet for bodies of different statures and proportions.
 *
 * Scenarios, on the small woman, the tall man and the short-legged man:
 * 1. Quiet standing has a positive static margin of stability (the centre of
 *    mass inside the feet's base).
 * 2. For bows of 15, 30 and 45 degrees, the hips' shift found by the search
 *    leaves the centre of mass within 1 mm of the middle of the soles along
 *    the heading, the shift is backward, and it grows with the bow's depth.
 * 3. Without the shift a 45 degree bow carries the centre of mass ahead of
 *    the middle of the soles.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Solves postures and reads the engine's centre of mass through the law's own offset and margin; a search that misses balance, a shift of the wrong sign or a non-monotone shift fails.
 * @evidence contracts/development/testing.md#independent-expectations Static balance is the centre of mass over the base of support; depth monotonicity follows from the moment of a pitched upper body; 1 mm is the search's stated tolerance.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers three bodies, three depths, standing and the unbalanced control.
 * @evidence contracts/development/testing.md#execution-ownership A local test: it prepares polygon men, so its name falls under the CI exclusion of test_human_.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 scenarios and what each pins.
 */
export function test_human_motion_everyday_balance(): void {
  const failures: string[] = [];
  const check = (label: string, ok: boolean): void => {
    if (!ok) failures.push(label);
  };
  for (const name of ["f-small", "m-tall", "m-short-legged"]) {
    const man = MotionBodies.population(name);
    const body: IHumanBody = createHumanBody(
      man.body.skeleton,
      man.body.profile,
    );
    const upright: IHumanPosture = stand.posture(
      body,
      { x: 0.2, y: 0, z: -0.4 },
      30,
    );
    check(
      `${name} standing margin ${HumanBalance.margin(body, upright).toFixed(3)}`,
      HumanBalance.margin(body, upright) > 0,
    );
    let previous: number = 0;
    for (const depth of [15, 30, 45]) {
      const back: number = HumanBalance.shift(
        body,
        (x: number): IHumanPosture => gesture.bow(body, upright, depth, x),
      );
      const offset: number = HumanBalance.offset(
        body,
        gesture.bow(body, upright, depth, back),
      );
      check(
        `${name} bow ${depth} offset ${(offset * 1000).toFixed(2)} mm`,
        Math.abs(offset) <= 0.001,
      );
      check(
        `${name} bow ${depth} shift ${back.toFixed(3)} grows`,
        back > previous,
      );
      previous = back;
    }
    check(
      `${name} unshifted bow falls forward`,
      HumanBalance.offset(body, gesture.bow(body, upright, 45, 0)) >
        HumanBalance.offset(body, upright) + 0.02,
    );
  }
  TestValidator.predicate(
    failures.join("; ") || "all checks",
    failures.length === 0,
  );
}
