import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import { GymnasticsFlight } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";

/**
 * `GymnasticsFlight.frozen` writes a posture by the clinical angles its own
 * resolution achieves, its limb goals cleared, so a flight can carry it by its
 * joints alone.
 *
 * The average man stands with his left elbow flexed 30 degrees, well inside its
 * range.
 *
 * Scenarios:
 *
 * 1. The frozen posture keeps the elbow's 30 degrees and has no limb goal.
 * 2. Its root and heading are the posture's own.
 */
export async function test_unit_motions_sport_gymnastics_flight_frozen(): Promise<void> {
  // Whole body: freezing resolves the posture over the full rig, topology and ROM.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const posture: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 15,
    pitch: 0,
    roll: 0,
    joints: { leftLowerArm: [30, 0, 0] },
    limbs: {},
  };
  const frozen: IAutoMovieMotionHumanPosture = GymnasticsFlight.frozen(
    body,
    posture,
  );
  TestValidator.predicate(
    "the achieved elbow, no goals",
    nclose(frozen.joints.leftLowerArm![0], 30, 1e-6) &&
      Object.keys(frozen.limbs).length === 0,
  );
  TestValidator.equals(
    "its own root and heading",
    [frozen.root, frozen.yaw],
    [posture.root, posture.yaw],
  );
}
