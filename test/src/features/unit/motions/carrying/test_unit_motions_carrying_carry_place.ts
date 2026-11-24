import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCarry,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanTrunk, carryPlace } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** Rounding of a forward-kinematics chain, metres. */
const ROUNDING: number = 1e-9;

/**
 * `carryPlace` is a hand's hold place in the performer's floor frame: a box
 * held in both hands 0.8 of the shoulders' half width either side at the
 * waist's height, ahead by a third of the arm or just clear of the abdomen; a
 * pushed handle with the upper arm hanging and the forearm level from the
 * shoulder (Hoozemans et al. 1998); a child on the loaded hip only; nothing in
 * one hand's free hand.
 *
 * The body is built whole (`humanFixtureBody`): the shoulder and the abdomen
 * are placed by forward kinematics.
 *
 * Scenarios, the average man upright at (1, 0, 2) facing +Z:
 *
 * 1. Both hands hold the box at x = 1 +/- 0.8 shoulder half widths, the waist's
 *    height, ahead by the larger of a third of the arm and the abdomen's front
 *    plus the forearm's radius, palms facing in.
 * 2. The right hand pushes from its shoulder down the upper arm and ahead the
 *    forearm, a forearm's radius out, its palm up.
 * 3. A hip carry places only the loaded hand; one-handed carrying places none.
 */
export async function test_unit_motions_carrying_carry_place(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const posture: IAutoMovieMotionHumanPosture = {
    root: { x: 1, y: 0.95, z: 2 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const abdomen: number =
    HumanTrunk.region(body, posture, "abdomen").point.z - 2;
  const ahead: number = Math.max(
    (m.upperArm + m.forearm) / 3,
    abdomen + m.forearmRadius,
  );
  const left: IAutoMovieMotionHumanCarry.IPlaceResult = carryPlace(
    body,
    posture,
    "twoHands",
    "left",
    "left",
  );
  const right: IAutoMovieMotionHumanCarry.IPlaceResult = carryPlace(
    body,
    posture,
    "twoHands",
    "right",
    "left",
  );
  TestValidator.predicate(
    "the box",
    vclose(
      left!.point,
      { x: 1 + 0.8 * m.shoulderHalfWidth, y: m.waistHeight, z: 2 + ahead },
      ROUNDING,
    ) &&
      vclose(
        right!.point,
        { x: 1 - 0.8 * m.shoulderHalfWidth, y: m.waistHeight, z: 2 + ahead },
        ROUNDING,
      ) &&
      vclose(left!.normal, { x: -1, y: 0, z: 0 }, ROUNDING) &&
      vclose(right!.normal, { x: 1, y: 0, z: 0 }, ROUNDING),
  );
  const shoulder: IAutoMovieVector3 = HumanTrunk.resolve(body, posture).get(
    "rightUpperArm",
  )!.worldPosition;
  const pushed: IAutoMovieMotionHumanCarry.IPlaceResult = carryPlace(
    body,
    posture,
    "push",
    "right",
    "right",
  );
  TestValidator.predicate(
    "the handle",
    vclose(
      pushed!.point,
      {
        x: shoulder.x - m.forearmRadius,
        y: shoulder.y - m.upperArm,
        z: shoulder.z + m.forearm,
      },
      ROUNDING,
    ) && nclose(pushed!.normal.y, 1, ROUNDING),
  );
  TestValidator.predicate(
    "the hip and one hand",
    carryPlace(body, posture, "hip", "left", "left") !== undefined &&
      carryPlace(body, posture, "hip", "right", "left") === undefined &&
      carryPlace(body, posture, "oneHand", "left", "left") === undefined,
  );
}
