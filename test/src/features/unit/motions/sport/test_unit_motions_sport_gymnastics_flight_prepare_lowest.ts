import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import { GymnasticsFlight } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";

/**
 * `GymnasticsFlight.prepareLowest` prepares one body's lowest-point reading for
 * a touchdown search: each reading follows the posture it is given.
 *
 * The average man stands, then tucks his knees 90 degrees.
 *
 * Scenarios:
 *
 * 1. Standing, the prepared reader agrees with `lowest`.
 * 2. Rooted 0.5 m up, it reads exactly 0.5 m higher.
 * 3. Tucked, his feet come up behind him, so his lowest point rises: a reading
 *    after another does not repeat it.
 */
export async function test_unit_motions_sport_gymnastics_flight_prepare_lowest(): Promise<void> {
  // Whole body: the reader resolves postures and reads every collider of the profile.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const standing: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const lowest: (posture: IAutoMovieMotionHumanPosture) => number =
    GymnasticsFlight.prepareLowest(body);
  const stood: number = lowest(standing);
  TestValidator.predicate(
    "agrees, lifts and follows",
    nclose(stood, GymnasticsFlight.lowest(body, standing), 1e-12) &&
      nclose(
        lowest({
          ...standing,
          root: { x: 0, y: 0.5, z: 0 },
        }) - stood,
        0.5,
        1e-9,
      ) &&
      lowest({
        ...standing,
        joints: { leftLowerLeg: [90, 0, 0], rightLowerLeg: [90, 0, 0] },
      }) >
        stood,
  );
}
