import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import { GymnasticsFlight } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";

/**
 * How far a standing body's lowest collision point may sit from the floor,
 * metres: the sole's collider against the rig's rest stance.
 */
const SOLE: number = 0.03;

/**
 * `GymnasticsFlight.lowest` is the height of a posture's lowest collision point
 * in the world.
 *
 * The average man stands upright on the floor, his root at the origin: a
 * posture's root is the body's offset from its rest stance on the floor.
 *
 * Scenarios:
 *
 * 1. Standing, his lowest point is at the floor, within the sole's 3 cm.
 * 2. Rooted 1 m higher, it is exactly 1 m higher.
 */
export async function test_unit_motions_sport_gymnastics_flight_lowest(): Promise<void> {
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
    "on the floor, and lifted",
    Math.abs(low) <= SOLE && nclose(lifted - low, 1, 1e-9),
  );
}
