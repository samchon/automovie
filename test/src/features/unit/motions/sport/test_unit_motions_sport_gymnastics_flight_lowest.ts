import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import { GymnasticsFlight } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";

/**
 * `GymnasticsFlight.lowest` is the height of a posture's lowest collision point
 * in the world.
 *
 * The average man stands upright on the floor, his root at the origin: a
 * posture's root is the body's offset from its rest stance on the floor.
 *
 * Scenarios:
 *
 * 1. Rooted 1 m higher, his lowest point is exactly 1 m higher: the reading
 *    follows the root rigidly.
 * 2. Rooted 1 m along +X, it is the same height.
 */
export async function test_unit_motions_sport_gymnastics_flight_lowest(): Promise<void> {
  // Whole body: the lowest point resolves the posture and reads every collider of the profile.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const standing: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const low: number = GymnasticsFlight.lowest(body, standing);
  const lifted: number = GymnasticsFlight.lowest(body, {
    ...standing,
    root: { x: 0, y: 1, z: 0 },
  });
  TestValidator.predicate(
    "lifted, and moved along",
    nclose(lifted - low, 1, 1e-9) &&
      nclose(
        GymnasticsFlight.lowest(body, {
          ...standing,
          root: { x: 1, y: 0, z: 0 },
        }),
        low,
        1e-9,
      ),
  );
}
