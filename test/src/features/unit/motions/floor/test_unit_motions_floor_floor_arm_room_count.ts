import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import { floorArmRoom } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";

/** The fewest intervals a blend's scan reads (`floorArmRoom`'s `SCAN`). */
const SCAN: number = 16;

/**
 * `floorArmRoom.count` is the number of evenly spaced intervals that keep any
 * arm within the audit's self-penetration allowance between two readings of a
 * blend: the joints' turns times their reaches, summed, over twice the
 * allowance, and never fewer than `SCAN`.
 *
 * Scenarios:
 *
 * 1. A blend that turns no joint needs only `SCAN`.
 * 2. A half-turn of the shoulder needs more than `SCAN`.
 * 3. The count does not depend on the blend's direction.
 * 4. A larger turn needs no fewer intervals.
 */
export async function test_unit_motions_floor_floor_arm_room_count(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const posture = (shoulder: number): IAutoMovieMotionHumanPosture => ({
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: { leftUpperArm: [shoulder, 0, 0] },
    limbs: {},
  });
  TestValidator.equals(
    "no turn",
    floorArmRoom.count(body, posture(30), posture(30)),
    SCAN,
  );
  const half: number = floorArmRoom.count(body, posture(0), posture(180));
  TestValidator.predicate(`a half turn (${half})`, half > SCAN);
  TestValidator.equals(
    "either direction",
    floorArmRoom.count(body, posture(180), posture(0)),
    half,
  );
  TestValidator.predicate(
    "a larger turn",
    floorArmRoom.count(body, posture(-90), posture(180)) >= half,
  );
}
