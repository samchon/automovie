import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import {
  HumanBalance,
  HumanBalanceExtrapolated,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";

/** Rounding of a mass-weighted forward-kinematics sum, metres. */
const ROUNDING: number = 1e-9;

/**
 * Rounding of a margin read through a central difference over 1/240 s, metres:
 * the sum's rounding divided by the step.
 */
const DIFFERENCE: number = 1e-6;

/** How far a 0.5 m/s glide's margin lies from the still one at least, metres. */
const MOVED: number = 1e-3;

/**
 * `HumanBalanceExtrapolated` is the dynamic margin of stability at an instant
 * (Hof et al. 2005): the support margin of the centre of mass extrapolated by
 * its velocity, read by a central difference over a tenth of a 24 Hz frame,
 * over the pendulum's time constant. A still movement's margin is the static
 * one, and a movement gliding at a constant velocity keeps one margin at every
 * instant, its extrapolation moving with it; a glide forward moves the
 * extrapolated centre forward, so its margin differs from the still one.
 *
 * The body is built whole (`humanFixtureBody`): the centre weighs every
 * segment's mass placed by forward kinematics.
 *
 * Scenarios, the average man upright:
 *
 * 1. Standing still, the dynamic margin equals `HumanBalance.margin`.
 * 2. Gliding along +Z at 0.5 m/s, the margin at 1 s equals the margin at 3 s, and
 *    differs from the still margin.
 * 3. `prepare` reads the same margin as the one-shot reader.
 */
export async function test_unit_motions_everyday_human_balance_extrapolated(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const at: (z: number) => IAutoMovieMotionHumanPosture = (
    z: number,
  ): IAutoMovieMotionHumanPosture => ({
    root: { x: 0, y: 0, z },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  });
  const still: number = HumanBalanceExtrapolated(
    body,
    (): IAutoMovieMotionHumanPosture => at(0),
    1,
  );
  TestValidator.predicate(
    "still",
    nclose(still, HumanBalance.margin(body, at(0)), ROUNDING),
  );
  const glide: (seconds: number) => IAutoMovieMotionHumanPosture = (
    seconds: number,
  ): IAutoMovieMotionHumanPosture => at(0.5 * seconds);
  const early: number = HumanBalanceExtrapolated(body, glide, 1);
  TestValidator.predicate(
    "gliding",
    nclose(early, HumanBalanceExtrapolated(body, glide, 3), DIFFERENCE) &&
      Math.abs(early - still) > MOVED &&
      nclose(HumanBalanceExtrapolated.prepare(body)(glide, 1), early, ROUNDING),
  );
}
