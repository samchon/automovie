import type {
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import { GymnasticsFlight } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";

/**
 * `GymnasticsFlight.freeze` resolves a posture once and gives both its frozen
 * view (as `frozen` writes it) and the pose it resolved to.
 *
 * The average man stands with his right knee flexed 40 degrees.
 *
 * Scenarios:
 *
 * 1. The frozen view is `frozen`'s.
 * 2. The pose carries the knee's 40 degrees.
 */
export async function test_unit_motions_sport_gymnastics_flight_freeze(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const posture: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: body.measure.hipHeight, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: { rightLowerLeg: [40, 0, 0] },
    limbs: {},
  };
  const frozen: ReturnType<typeof GymnasticsFlight.freeze> =
    GymnasticsFlight.freeze(body, posture);
  TestValidator.equals(
    "the frozen view",
    frozen.posture,
    GymnasticsFlight.frozen(body, posture),
  );
  const knee: IAutoMovieJointPose | undefined = frozen.pose.joints.find(
    (j: IAutoMovieJointPose): boolean => j.bone === "rightLowerLeg",
  );
  TestValidator.predicate(
    "the resolved knee",
    knee !== undefined && nclose(knee.flexion ?? 0, 40, 1e-6),
  );
}
