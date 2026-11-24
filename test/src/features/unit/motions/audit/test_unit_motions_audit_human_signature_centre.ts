import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { auditStanceMotion } from "../../../internal/auditStanceMotion";
import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";

/**
 * The share of stature the standing centre of mass lies at: 0.53 to 0.59,
 * about the 55 to 57 % Winter reports for adults (Winter 2009, Biomechanics and
 * Motor Control of Human Movement, 4th ed., table 4.1), widened for the
 * fixture's proportions.
 */
const HEIGHT: readonly [number, number] = [0.53, 0.59];

/**
 * `HumanSignature.centre` reads the whole-body centre of mass on the body's
 * own mass model.
 *
 * Scenarios, the average man's quiet stance at the origin:
 *
 * 1. Its height lies within Winter's share of the stature, and it lies over the
 *    feet's midline, within a centimetre of x = 0.
 * 2. Carried 1 m along +X, the centre moves 1 m with it and keeps its height.
 *
 * The body is built whole (`humanFixtureBody`): the centre reads the body's
 * mass model on its displayed bones.
 */
export async function test_unit_motions_audit_human_signature_centre(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const centre = (x: number): IAutoMovieVector3 =>
    HumanSignature.centre(
      HumanSignature(
        auditStanceMotion(body, { shift: () => ({ x, y: 0, z: 0 }) }),
        "a",
        body,
        0,
      ),
      0,
    );
  const still: IAutoMovieVector3 = centre(0);
  TestValidator.predicate(
    "standing",
    still.y >= HEIGHT[0] * body.measure.stature &&
      still.y <= HEIGHT[1] * body.measure.stature &&
      Math.abs(still.x) <= 0.01,
  );
  const carried: IAutoMovieVector3 = centre(1);
  TestValidator.predicate(
    "carried",
    nclose(carried.x - still.x, 1, 1e-9) && nclose(carried.y, still.y, 1e-9),
  );
}
