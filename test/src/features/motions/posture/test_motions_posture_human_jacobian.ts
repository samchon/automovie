import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanJacobian,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanStance } from "@automovie/motions";
import {
  HumanJacobian,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { vclose } from "../../internal/vclose";

/** The half step of a central difference, clinical degrees. */
const H: number = 1e-3;

/**
 * Agreement of a derivative with its central difference, metres per degree: the
 * truncation, h² over six of the third derivative, and the rounding of the
 * forward kinematics over h are both far below it.
 */
const DIFFERENCE: number = 1e-6;

/** A material point on the foot, off its joint so it reads the leg's twist. */
const LOCAL: IAutoMovieVector3 = { x: 0.03, y: -0.04, z: 0.07 };

/**
 * `HumanJacobian` differentiates a posed body by its variables: each clinical
 * joint angle a rigid twist of the bones it moves, so a point's velocity per
 * degree is `v + ω × p` (`velocity`, `twist`), radians per clinical degree.
 *
 * The body is built whole (`humanFixtureBody`): the Jacobian reads its rig and
 * its resolved bones.
 *
 * Scenarios, the average man standing:
 *
 * 1. Flexing the left elbow at 30 degrees: the twist leaves the elbow's centre
 *    still, the hand moves at `ω × (hand − elbow)`, and that velocity is the
 *    hand's central difference per degree.
 * 2. Each of the right hip's three clinical angles at (65, 15, 28) predicts the
 *    central difference of a material point on the right foot.
 */
export async function test_motions_posture_human_jacobian(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const standing: IAutoMovieMotionHumanPosture =
    AutoMovieMotionHumanStance.stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
  const posed = (
    bone: AutoMovieHumanoidBone,
    angles: readonly [number, number, number],
  ): IAutoMovieMotionHumanPosture => ({
    ...standing,
    limbs: {},
    joints: { ...standing.joints, [bone]: angles },
  });
  const bones = (
    posture: IAutoMovieMotionHumanPosture,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
    poseBones(body, resolveHumanPosture(body, posture));
  const difference = (
    read: (posture: IAutoMovieMotionHumanPosture) => IAutoMovieVector3,
    bone: AutoMovieHumanoidBone,
    angles: readonly [number, number, number],
    axis: number,
  ): IAutoMovieVector3 => {
    const shift = (d: number): [number, number, number] => [
      angles[0] + (axis === 0 ? d : 0),
      angles[1] + (axis === 1 ? d : 0),
      angles[2] + (axis === 2 ? d : 0),
    ];
    return Vector3.scale(
      Vector3.subtract(
        read(posed(bone, shift(H))),
        read(posed(bone, shift(-H))),
      ),
      1 / (2 * H),
    );
  };

  // 1. The elbow.
  const elbowAngles: [number, number, number] = [30, 0, 0];
  const bent: IAutoMovieMotionHumanPosture = posed("leftLowerArm", elbowAngles);
  const shown: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = bones(bent);
  const elbow: IAutoMovieVector3 = shown.get("leftLowerArm")!.worldPosition;
  const hand: IAutoMovieVector3 = shown.get("leftHand")!.worldPosition;
  const flex: IAutoMovieMotionHumanJacobian.IMotion = HumanJacobian(
    body,
    bent,
    shown,
    [{ kind: "angle", bone: "leftLowerArm", axis: 0 }],
  )[0]!;
  const turn: IAutoMovieMotionHumanJacobian.ITwist = HumanJacobian.twist(
    flex,
    "leftLowerArm",
    elbow,
  );
  const moved: IAutoMovieVector3 = HumanJacobian.velocity(
    flex,
    "leftHand",
    hand,
  );
  TestValidator.predicate(
    "the elbow turns the hand about its still centre",
    vclose(turn.linear, { x: 0, y: 0, z: 0 }, DIFFERENCE) &&
      vclose(
        moved,
        Vector3.cross(turn.angular, Vector3.subtract(hand, elbow)),
        DIFFERENCE,
      ) &&
      vclose(
        moved,
        difference(
          (p: IAutoMovieMotionHumanPosture): IAutoMovieVector3 =>
            bones(p).get("leftHand")!.worldPosition,
          "leftLowerArm",
          elbowAngles,
          0,
        ),
        DIFFERENCE,
      ),
  );

  // 2. The hip's three axes.
  const hipAngles: [number, number, number] = [65, 15, 28];
  const hipped: IAutoMovieMotionHumanPosture = posed(
    "rightUpperLeg",
    hipAngles,
  );
  const hipShown: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    bones(hipped);
  const point = (bone: IAutoMovieResolvedBone): IAutoMovieVector3 =>
    Vector3.add(
      bone.worldPosition,
      Quaternion.rotateVector(bone.worldRotation, LOCAL),
    );
  const motions: IAutoMovieMotionHumanJacobian.IMotion[] = HumanJacobian(
    body,
    hipped,
    hipShown,
    [0, 1, 2].map(
      (axis: number): IAutoMovieMotionHumanJacobian.IVariable => ({
        kind: "angle",
        bone: "rightUpperLeg",
        axis: axis === 0 ? 0 : axis === 1 ? 1 : 2,
      }),
    ),
  );
  const at: IAutoMovieVector3 = point(hipShown.get("rightFoot")!);
  TestValidator.predicate(
    "each hip angle predicts the foot point's derivative",
    [0, 1, 2].every((axis: number): boolean =>
      vclose(
        HumanJacobian.velocity(motions[axis]!, "rightFoot", at),
        difference(
          (p: IAutoMovieMotionHumanPosture): IAutoMovieVector3 =>
            point(bones(p).get("rightFoot")!),
          "rightUpperLeg",
          hipAngles,
          axis,
        ),
        DIFFERENCE,
      ),
    ),
  );
}
