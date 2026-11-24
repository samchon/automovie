import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import { GymnasticsFlight } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { vclose } from "../../../internal/vclose";

/**
 * `GymnasticsFlight.placed` moves a joint-written posture by its root so its
 * centre of mass lies on a point, as a flight places a body on its parabola.
 *
 * The average man, tucked with both hips and knees flexed 90 degrees, is placed
 * with his centre at (1, 2, 3).
 *
 * Scenarios:
 *
 * 1. The placed posture's centre lies on (1, 2, 3).
 * 2. Only its root moved: its joints and heading are its own.
 */
export async function test_unit_motions_sport_gymnastics_flight_placed(): Promise<void> {
  // Whole body: placing reads the centre, resolved over the full rig, ROM and mass model.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const tucked: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 1, z: 0 },
    yaw: 20,
    pitch: 0,
    roll: 0,
    joints: {
      leftUpperLeg: [90, 0, 0],
      rightUpperLeg: [90, 0, 0],
      leftLowerLeg: [90, 0, 0],
      rightLowerLeg: [90, 0, 0],
    },
    limbs: {},
  };
  const at: IAutoMovieVector3 = { x: 1, y: 2, z: 3 };
  const placed: IAutoMovieMotionHumanPosture = GymnasticsFlight.placed(
    body,
    body.massModel,
    tucked,
    at,
  );
  TestValidator.predicate(
    "the centre on the point",
    vclose(GymnasticsFlight.centre(body, body.massModel, placed), at, 1e-9),
  );
  TestValidator.equals(
    "only the root moved",
    { ...placed, root: tucked.root },
    tucked,
  );
}
