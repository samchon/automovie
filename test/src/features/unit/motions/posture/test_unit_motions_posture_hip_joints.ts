import { Quaternion, Transform, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { hipJoints, poseBones } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { vclose } from "../../../internal/vclose";

/** Rounding of a short forward-kinematics chain, metres. */
const ROUNDING: number = 1e-12;

/**
 * `hipJoints` places the two hip joints under a root by posing the root, its
 * rotation and the pelvis joint only: the same points a full pose gives, rigid
 * with the root.
 *
 * The body is built whole (`humanFixtureBody`): the hips hang from its pelvis.
 *
 * Scenarios:
 *
 * 1. At rest at the origin the hips mirror each other across the midline.
 * 2. With the pelvis flexed (10, 5, −8) under a root at (1, 0.9, 2) turned 40
 *    degrees, they are the full pose's thigh origins.
 * 3. Moved by (1, 0, −2) and turned 90 degrees, each rest hip is the rest one
 *    turned and moved.
 */
export async function test_unit_motions_posture_hip_joints(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const none: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const rest: Record<AutoMovieHumanSide, IAutoMovieVector3> = hipJoints(
    body,
    origin,
    none,
  );

  // 1. Mirrored.
  TestValidator.predicate(
    "the rest hips mirror each other",
    vclose(rest.left, { ...rest.right, x: -rest.right.x }, ROUNDING) &&
      rest.left.x !== rest.right.x,
  );

  // 2. As a full pose.
  const root: IAutoMovieVector3 = { x: 1, y: 0.9, z: 2 };
  const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    40,
  );
  const pelvis: [number, number, number] = [10, 5, -8];
  const hips: Record<AutoMovieHumanSide, IAutoMovieVector3> = hipJoints(
    body,
    root,
    turn,
    pelvis,
  );
  const full: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    {
      skeleton: body.skeleton.id,
      root: Transform.of(root, turn),
      joints: [{ bone: "hips", flexion: 10, abduction: 5, twist: -8 }],
    },
  );
  TestValidator.predicate(
    "the full pose's thigh origins",
    vclose(hips.left, full.get("leftUpperLeg")!.worldPosition, ROUNDING) &&
      vclose(hips.right, full.get("rightUpperLeg")!.worldPosition, ROUNDING),
  );

  // 3. Rigid with the root.
  const moved: IAutoMovieVector3 = { x: 1, y: 0, z: -2 };
  const quarter: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    90,
  );
  const carried: Record<AutoMovieHumanSide, IAutoMovieVector3> = hipJoints(
    body,
    moved,
    quarter,
  );
  TestValidator.predicate(
    "rigid with the root",
    (["left", "right"] satisfies AutoMovieHumanSide[]).every(
      (side: AutoMovieHumanSide): boolean =>
        vclose(
          carried[side],
          Vector3.add(moved, Quaternion.rotateVector(quarter, rest[side])),
          1e-9,
        ),
    ),
  );
}
