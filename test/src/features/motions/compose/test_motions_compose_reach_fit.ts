import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanReach,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";

/**
 * `AutoMovieMotionHumanReach.fit` makes a limb's goal reachable by a policy: a
 * point within reach is kept; one beyond it is clamped onto the straight arm's
 * reach, or refused.
 *
 * The average man stands with his arms down; his right wrist is asked half his
 * arm's reach ahead of the shoulder, and a hand beyond its full reach.
 *
 * Scenarios:
 *
 * 1. The point within reach is kept as asked.
 * 2. The point beyond reach is clamped to the full reach along the same line.
 * 3. The point beyond reach is refused under the refusal policy.
 *
 * The body is built whole (`humanFixtureBody`): the reach reads the body's pose
 * rig and arm chain by forward kinematics, records only `createHumanBody`
 * derives from the stored rig and profile.
 */
export async function test_motions_compose_reach_fit(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const posture: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: body.measure.hipHeight, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    resolveHumanPosture(body, posture),
  );
  const shoulder: IAutoMovieVector3 = bones.get("rightUpperArm")!.worldPosition;
  const elbow: IAutoMovieVector3 = bones.get("rightLowerArm")!.worldPosition;
  const wrist: IAutoMovieVector3 = bones.get("rightHand")!.worldPosition;
  const reach: number =
    Vector3.distance(shoulder, elbow) + Vector3.distance(elbow, wrist);
  const ahead = (distance: number): IAutoMovieVector3 =>
    Vector3.add(shoulder, { x: 0, y: 0, z: distance });
  const beyond: IAutoMovieVector3 = ahead(reach + body.measure.hand);

  // 1. Within.
  TestValidator.equals(
    "a reachable point is kept",
    AutoMovieMotionHumanReach.fit(
      body,
      posture,
      "rightArm",
      ahead(reach / 2),
      "refuse",
    ).point,
    ahead(reach / 2),
  );

  // 2. Clamped.
  TestValidator.predicate(
    "a point beyond reach is clamped to the full reach",
    Vector3.distance(
      AutoMovieMotionHumanReach.fit(body, posture, "rightArm", beyond, "clamp")
        .point,
      ahead(reach),
    ) <= 1e-9,
  );

  // 3. Refused.
  TestValidator.error("a point beyond reach is refused", (): void => {
    AutoMovieMotionHumanReach.fit(body, posture, "rightArm", beyond, "refuse");
  });
}
