import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import { GymnasticsFlight } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";

/**
 * The band of a standing adult's centre of mass height as a share of stature:
 * about 0.55 to 0.57 (Winter, Biomechanics and Motor Control of Human Movement,
 * 4th ed., 2009, Table 4.1 segment fractions), widened for the rig's own
 * segments.
 */
const STANDING: readonly [number, number] = [0.53, 0.6];

/**
 * `GymnasticsFlight.centre` is the whole body's centre of mass in a posture,
 * read by the body's mass model on the posture's resolved bones.
 *
 * The average man stands upright on the floor at the origin facing +Z: a
 * posture's root is the body's offset from its rest stance on the floor.
 *
 * Scenarios:
 *
 * 1. His centre stands between 0.53 and 0.60 of his stature, on his midline.
 * 2. Rooted 1 m higher and 2 m along +X, the centre moves by exactly that.
 */
export async function test_unit_motions_sport_gymnastics_flight_centre(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const standing: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const c: IAutoMovieVector3 = GymnasticsFlight.centre(
    body,
    body.massModel,
    standing,
  );
  const share: number = c.y / body.measure.stature;
  TestValidator.predicate(
    "a standing centre of mass",
    share >= STANDING[0] && share <= STANDING[1] && Math.abs(c.x) < 0.01,
  );
  const moved: IAutoMovieVector3 = GymnasticsFlight.centre(
    body,
    body.massModel,
    { ...standing, root: { x: 2, y: 1, z: 0 } },
  );
  TestValidator.predicate(
    "moved with its root",
    nclose(moved.x - c.x, 2, 1e-9) &&
      nclose(moved.y - c.y, 1, 1e-9) &&
      nclose(moved.z - c.z, 0, 1e-9),
  );
}
