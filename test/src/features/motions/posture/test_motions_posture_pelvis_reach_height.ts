import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanFrame
} from "../../../../../packages/motions/src/posture/internal/HumanFrame";
import {
  hipJoints
} from "../../../../../packages/motions/src/posture/internal/hipJoints";
import {
  pelvisReachHeight
} from "../../../../../packages/motions/src/posture/internal/pelvisReachHeight";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";

/** Rounding of a short forward-kinematics chain and one square root, metres. */
const ROUNDING: number = 1e-9;

/**
 * `pelvisReachHeight` is the highest the hips may ride over some ankles: the
 * asked height, lowered by exactly the excess that keeps each ankle within a
 * near-straight leg, `STRAIGHT (thigh + shank)`, of its hip joint, by
 * Pythagoras on the hip's horizontal offset from the ankle; an ankle out of
 * that reach horizontally lowers nothing.
 *
 * The body is built whole (`humanFixtureBody`) for its hips and legs.
 *
 * Scenarios, the hips asked at 0.95 m over the origin facing +Z:
 *
 * 1. With no ankle the height is the one asked.
 * 2. With the left ankle on the floor under its hip, past the leg's reach: the hip
 *    joint comes down to exactly the reach above it.
 * 3. With it 0.3 m ahead of its hip: the hip lies at √(reach² − 0.3²) above it.
 * 4. With it farther ahead than the reach: the height is the one asked.
 */
export async function test_motions_posture_pelvis_reach_height(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const hips: IAutoMovieVector3 = { x: 0, y: 0.95, z: 0 };
  const reach: number =
    pelvisReachHeight.STRAIGHT * (body.measure.thigh + body.measure.shank);
  const hip = (height: number): Record<AutoMovieHumanSide, IAutoMovieVector3> =>
    hipJoints(
      body,
      AutoMovieEngineVector3.subtract(
        { ...hips, y: height },
        AutoMovieEngineQuaternion.rotateVector(HumanFrame.turn(0), body.rest.get("hips")!),
      ),
      HumanFrame.turn(0),
    );
  const under: IAutoMovieVector3 = { ...hip(0.95).left, y: 0 };

  // 1. No ankle.
  TestValidator.predicate(
    "no ankle, the asked height",
    pelvisReachHeight(body, hips, 0, {}) === 0.95,
  );

  // 2. Straight under.
  const down: number = pelvisReachHeight(body, hips, 0, { left: under });
  TestValidator.predicate(
    "the hip at the leg's reach above the ankle",
    nclose(hip(down).left.y, reach, ROUNDING),
  );

  // 3. Ahead.
  const ahead: IAutoMovieVector3 = { ...under, z: under.z + 0.3 };
  TestValidator.predicate(
    "the hip by Pythagoras above an ankle ahead",
    nclose(
      hip(pelvisReachHeight(body, hips, 0, { left: ahead })).left.y,
      Math.sqrt(reach * reach - 0.09),
      ROUNDING,
    ),
  );

  // 4. Out of reach.
  TestValidator.predicate(
    "an ankle out of reach lowers nothing",
    pelvisReachHeight(body, hips, 0, {
      left: { ...under, z: under.z + reach + 0.1 },
    }) === 0.95,
  );
}
