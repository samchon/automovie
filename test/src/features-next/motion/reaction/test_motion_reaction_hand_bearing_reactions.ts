import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanCarryPerson,
  HumanRefusal,
} from "@automovie/motions";
import { HumanLoad } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";

/**
 * Two hand supports divide vertical load according to the centre’s lever arms.
 *
 * Scenarios:
 * 1. Move the centre across a one-metre baseline and beyond its right-hand endpoint.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Two hand supports divide vertical load according to the centre’s lever arms.
 * @evidence contracts/development/testing.md#independent-expectations Moment balance about the left hand gives the right reaction equal to the centre’s distance along the unit baseline.
 * @evidence contracts/development/testing.md#distinguishing-cases At and beyond the end the opposite hand cannot carry a negative reaction.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_reaction_hand_bearing_reactions(): void {
  const HumanCarriedCoupling: typeof AutoMovieMotionHumanCarryPerson.HumanCarriedCoupling =
    AutoMovieMotionHumanCarryPerson.HumanCarriedCoupling;
  const HumanCarriedCouplingLoad: typeof AutoMovieMotionHumanCarryPerson.HumanCarriedCouplingLoad =
    AutoMovieMotionHumanCarryPerson.HumanCarriedCouplingLoad;
  const p = (x: number, z: number): IAutoMovieVector3 => ({ x, y: 0, z });
  const tri = [p(0, 0), p(1, 0), p(0, 1)];
  const thirds = HumanCarriedCouplingLoad.shares(tri, p(1 / 3, 1 / 3));
  TestValidator.predicate(
    "triangle barycentre and nonnegative reactions beyond its hull",
    thirds.every((v) => nclose(v, 1 / 3, 1e-9)) &&
      HumanCarriedCouplingLoad.shares(tri, p(2, 2)).every((v) => v >= 0),
  );
  const line = HumanCarriedCouplingLoad.shares(
    [p(0, 0), p(1, 0), p(2, 0)],
    p(0.3, 0),
  );
  TestValidator.predicate(
    "collinear contact uses nearest bracketing pair",
    line.every((v, i) => nclose(v, [0.7, 0.3, 0][i]!, 1e-9)) &&
      HumanCarriedCouplingLoad.shares([p(0, 0)], p(5, 5))[0] === 1,
  );
  const small = motionHumanBody("f-small");
  const base = HumanCarriedCoupling.couple(
    small,
    small,
    AutoMovieMotionHumanCarryPerson.carryPerson.CARRIES.cradle,
    "cradle",
  );
  const load = HumanCarriedCouplingLoad.load(small, base);
  const own = base.contacts
    .filter((c) => c.on.role === HumanCarriedCoupling.BEARER)
    .reduce((sum, c) => sum + c.load, 0);
  TestValidator.predicate(
    "reaction fractions conserve total carried mass",
    nclose(
      base.contacts.reduce((sum, c) => sum + c.load, 0),
      1,
      1e-9,
    ) && nclose(load.load, own * base.mass, 1e-9),
  );
  const capacity = (load.mass * load.height) / Math.abs(load.ahead);
  if (capacity > base.mass) {
    let rejected = false;
    try {
      HumanCarriedCoupling.couple(
        small,
        small,
        AutoMovieMotionHumanCarryPerson.carryPerson.CARRIES.cradle,
        "cradle",
        capacity - base.mass + 1,
      );
    } catch (error) {
      rejected =
        error instanceof HumanRefusal &&
        error.kind === "participant" &&
        error.axis === "mass" &&
        error.feasible?.kind === "range" &&
        error.feasible.maximum !== null &&
        nclose(error.feasible.maximum, capacity, 1e-6 * capacity);
    }
    TestValidator.predicate(
      "one excess kilogram reports the physical capacity",
      rejected,
    );
  }
  TestValidator.predicate(
    "lean admits below and refuses above moment capacity",
    HumanLoad.lean({ ...load, load: capacity * 0.999 }) !== null &&
      HumanLoad.lean({ ...load, load: capacity * 1.001 }) === null,
  );
  const supports: IAutoMovieVector3[] = [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
  ];
  for (const [x, right] of [
    [0, 0],
    [0.25, 0.25],
    [1, 1],
    [1.25, 1],
  ] as const) {
    const shares: number[] = HumanCarriedCouplingLoad.shares(supports, {
      x,
      y: 0,
      z: 0,
    });
    TestValidator.predicate(
      "nonnegative balanced reactions",
      nclose(shares[0]!, 1 - right) && nclose(shares[1]!, right),
    );
  }
}
