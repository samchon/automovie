import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  poseBones
} from "../../../../../packages/motions/src/posture/internal/poseBones";
import {
  resolveHumanPosture
} from "../../../../../packages/motions/src/posture/internal/resolveHumanPosture";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { vclose } from "../../internal/vclose";

/**
 * How near a planted end joint stays to its goal, metres: a millimetre, the
 * goal tolerance a limb is solved to (`HumanArmTrajectoryTerms.TOLERANCE`).
 */
const SLIP: number = 1e-3;

/** The pelvis's sway: offsets of the root from standing, metres, within reach. */
const SWAY: readonly IAutoMovieVector3[] = [
  { x: 0, y: 0, z: 0 },
  { x: 0.04, y: -0.03, z: 0.02 },
  { x: -0.03, y: -0.06, z: -0.02 },
  { x: 0.02, y: -0.08, z: 0.05 },
];

/**
 * A plant and a hold do not slip: a posture's planted limb goal puts the limb's
 * end joint on the goal's point (`resolveHumanPosture`, the two-bone fit of
 * each goal), so while the pelvis sways over a planted foot and a hand held on
 * a fixed point, the ankle and the wrist stay where they were planted.
 *
 * The body is built whole (`humanFixtureBody`): the resolve reads its rig, its
 * limb chains and its ROM projection.
 *
 * Scenarios, the average man standing, his left foot planted where it stands
 * and his left hand held 0.2 m ahead of where it hangs:
 *
 * 1. At every sway of the root (up to 8 cm down and 5 cm aside) the left foot's
 *    joint lies within a millimetre of its planted point.
 * 2. So does the left hand's, on its held point.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines world stationarity for held hand and planted foot endpoints while the root sways.
 * @evidence contracts/development/testing.md#behavioral-verification Resolves a fully built rig across the set of imposed pelvis sway positions and reads its ankle and wrist endpoints.
 * @evidence contracts/development/testing.md#independent-expectations The independently authored world points are fixed throughout the sway; both endpoints must remain within 1 mm of their respective targets.
 */
export async function test_motions_posture_plant_hold(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const standing: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: body.measure.hipHeight, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const rest: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    resolveHumanPosture(body, standing),
  );
  const at = (bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
    rest.get(bone)!.worldPosition;
  const foot: IAutoMovieVector3 = at("leftFoot");
  const knee: IAutoMovieVector3 = at("leftLowerLeg");
  const wrist: IAutoMovieVector3 = at("leftHand");
  const elbow: IAutoMovieVector3 = at("leftLowerArm");
  const held: IAutoMovieVector3 = {
    x: wrist.x,
    y: wrist.y + 0.1,
    z: wrist.z + 0.2,
  };
  const swayed: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>[] = SWAY.map(
    (
      d: IAutoMovieVector3,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
      poseBones(
        body,
        resolveHumanPosture(body, {
          ...standing,
          root: {
            x: standing.root.x + d.x,
            y: standing.root.y + d.y,
            z: standing.root.z + d.z,
          },
          limbs: {
            leftLeg: {
              point: foot,
              bend: { x: knee.x, y: knee.y, z: knee.z + 0.3 },
              planted: true,
            },
            leftArm: {
              point: held,
              bend: { x: elbow.x + 0.1, y: elbow.y, z: elbow.z - 0.1 },
              planted: true,
            },
          },
        }),
      ),
  );

  // 1. The planted foot.
  TestValidator.predicate(
    "the planted foot does not slip",
    swayed.every(
      (bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>): boolean =>
        vclose(bones.get("leftFoot")!.worldPosition, foot, SLIP),
    ),
  );

  // 2. The held hand.
  TestValidator.predicate(
    "the held hand does not slip",
    swayed.every(
      (bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>): boolean =>
        vclose(bones.get("leftHand")!.worldPosition, held, SLIP),
    ),
  );
}
