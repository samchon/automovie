import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  Quaternion,
  getConstraint,
  jointToQuaternion,
  skeletonJointAxes,
  swingTwistRange,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanTrunk,
  type IHumanBody,
  type IHumanPosture,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * An upper arm written in either reading of its rotation displays the arm
 * that rotation puts it in: the posture resolver shows the written angles'
 * rotation, whichever of the two clinical triples carries it.
 *
 * The angles are the average man's right arm in the lexicon's `smoke` row at
 * two neighbouring frames of its reach to the lips (`hand_verdicts_smoke`),
 * where the carried arm's upper arm was written as `[43.5587, -58.0774,
 * -59.2508]` and then `[136.6565, 118.6384, 117.2703]`, the forearm and the
 * hand moving little; the little finger's end then stepped 13.9 mm.
 *
 * Scenarios:
 * 1. The two upper-arm rotations lie within a few degrees of each other (5,
 *    the reach's turn over 1/48 s and more), so they are one rotation's two
 *    readings, moved by the reach.
 * 2. Each frame, resolved as a quiet stance with those arm angles and no arm
 *    goal, displays the little finger's end within 0.1 mm of where forward
 *    kinematics of the written angles puts it: the resolver shows the
 *    rotation it is given (both rotations lie inside the shoulder's range).
 * 3. The displayed little finger's end moves between the two frames no more
 *    than the written angles move it, plus 0.1 mm.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Resolves postures through the public resolver and compares the displayed finger with the forward kinematics of the written angles; a resolver that clamps one reading of a rotation and not the other fails with the distances.
 * @evidence contracts/development/testing.md#independent-expectations The angles are another specification's measured frames; the expected places are forward kinematics of those angles, not the resolver's.
 * @evidence contracts/development/testing.md#distinguishing-cases The two readings of one rotation, at two neighbouring frames.
 * @evidence contracts/development/testing.md#execution-ownership Two posture solves on one prepared body; it is a real-body test; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, where the angles come from and the 3 scenarios with their bounds.
 */
export function test_human_motion_core_arm_readings(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const base: IHumanPosture = stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
  const frames: readonly (readonly [
    readonly [number, number, number],
    readonly [number, number, number],
    readonly [number, number, number],
  ])[] = [
    [
      [43.5587, -58.0774, -59.2508],
      [88.0082, 0, -41.0377],
      [36.83, 1.8962, 0],
    ],
    [
      [136.6565, 118.6384, 117.2703],
      [90.8652, 0, -41.9114],
      [37.225, 1.7296, 0],
    ],
  ];
  const bone: AutoMovieHumanoidBone = "rightUpperArm";
  const joint: swingTwistRange.IJoint = {
    axes: skeletonJointAxes(body.skeleton, HUMANOID_JOINT_AXES)[bone]!,
    frame: HUMANOID_REST_FRAME[bone],
  };
  const constraint: NonNullable<ReturnType<typeof getConstraint>> = getConstraint(
    bone,
    body.skeleton.bones.find((b: IAutoMovieBone): boolean => b.bone === bone)
      ?.constraint ?? null,
  )!;
  const complaints: string[] = [];
  const posture = (
    frame: (typeof frames)[number],
  ): IHumanPosture => {
    const { rightArm: _, ...limbs } = base.limbs;
    void _;
    return {
      ...base,
      joints: {
        ...base.joints,
        rightUpperArm: frame[0],
        rightLowerArm: frame[1],
        rightHand: frame[2],
      },
      limbs,
    };
  };
  const tip: AutoMovieHumanoidBone = "rightLittleDistal";
  const shown: IAutoMovieVector3[] = frames.map(
    (frame): IAutoMovieVector3 =>
      poseBones(body, resolveHumanPosture(body, posture(frame))).get(tip)!
        .worldPosition,
  );
  const written: IAutoMovieVector3[] = frames.map(
    (frame): IAutoMovieVector3 => {
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        HumanTrunk.resolve(body, posture(frame));
      return bones.get(tip)!.worldPosition;
    },
  );
  const rotations: IAutoMovieQuaternion[] = frames.map(
    (frame): IAutoMovieQuaternion =>
      Quaternion.normalize(
        jointToQuaternion(
          { flexion: frame[0][0], abduction: frame[0][1], twist: frame[0][2] },
          joint.axes,
          joint.frame,
        ),
      ),
  );
  const apart = (p: IAutoMovieVector3, q: IAutoMovieVector3): number =>
    Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
  const turn: number = (Quaternion.angle(rotations[0]!, rotations[1]!) * 180) / Math.PI;
  const rooms: number[] = rotations.map((q: IAutoMovieQuaternion): number =>
    swingTwistRange.room(q, constraint, joint),
  );
  if (!(turn <= 5))
    complaints.push(
      `the two upper-arm readings are ${turn.toFixed(2)} degrees apart, within 5 expected`,
    );
  for (const k of [0, 1] as const)
    if (!(apart(shown[k]!, written[k]!) <= 1e-4))
      complaints.push(
        `frame ${k}: the little finger is shown ${(apart(shown[k]!, written[k]!) * 1000).toFixed(2)} mm from where its angles put it (the shoulder ${rooms[k]!.toFixed(2)} degrees inside its range), within 0.1 mm expected`,
      );
  if (
    !(apart(shown[0]!, shown[1]!) <= apart(written[0]!, written[1]!) + 1e-4)
  )
    complaints.push(
      `between the frames the shown little finger moves ${(apart(shown[0]!, shown[1]!) * 1000).toFixed(2)} mm, its angles move it ${(apart(written[0]!, written[1]!) * 1000).toFixed(2)} mm`,
    );
  TestValidator.equals(
    "an upper arm in either reading displays its rotation",
    complaints,
    [],
  );
}
