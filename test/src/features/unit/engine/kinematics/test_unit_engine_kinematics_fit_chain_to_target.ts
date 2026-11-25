import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Quaternion,
  Vector3,
  fitChainToTarget,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";

/** How near a fitted hand's rotation lies to its demand, degrees. */
const TURN: number = 1e-3;

/** How near a mirrored fit's clinical angles lie to the original's, degrees. */
const MIRROR: number = 1e-5;

/** The right arm's bones and their left twins. */
const TWINS: Readonly<
  Partial<Record<AutoMovieHumanoidBone, AutoMovieHumanoidBone>>
> = {
  rightUpperArm: "leftUpperArm",
  rightLowerArm: "leftLowerArm",
  rightHand: "leftHand",
};

/**
 * `fitChainToTarget` fits a two-bone chain to a target point and, given one, an
 * effector rotation: the wrist takes the demand, the forearm's twist supplying
 * only the part of it about the forearm's axis (`solveDistalTwist`), and the
 * fit is left-right symmetric, a mirrored target and demand giving the mirrored
 * clinical angles.
 *
 * The body is built whole (`humanFixtureBody`): the fit reads its skeleton,
 * topology, joint axes and rest frames. The right arm reaches a point ahead of
 * its shoulder, the wrist flexed −20 and abducted −10 degrees.
 *
 * Scenarios, demands turning the fitted hand 12 degrees about the forearm's
 * axis, across it and between:
 *
 * 1. The hand reaches each demand within a thousandth of a degree.
 * 2. The forearm's twist changes by no more than the demand's 12 degrees, and by
 *    exactly that about its own axis.
 * 3. The left arm fitted to the mirrored target and the reflected demand takes the
 *    right arm's clinical angles.
 */
export async function test_unit_engine_kinematics_fit_chain_to_target(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const rest: IAutoMoviePose = {
    skeleton: body.skeleton.id,
    root: null,
    joints: [],
  };
  const frames = (
    pose: IAutoMoviePose,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
    new Map(
      resolvePose(
        pose,
        body.skeleton,
        HUMANOID_JOINT_AXES,
        HUMANOID_REST_FRAME,
      ).map(
        (
          b: IAutoMovieResolvedBone,
        ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [b.bone, b],
      ),
    );
  const fit = (
    side: AutoMovieHumanSide,
    pose: IAutoMoviePose,
    target: IAutoMovieVector3,
    rotation?: IAutoMovieQuaternion,
  ): IAutoMoviePose =>
    fitChainToTarget({
      skeleton: body.skeleton,
      pose,
      target,
      chain: {
        upper: `${side}UpperArm`,
        lower: `${side}LowerArm`,
        effector: `${side}Hand`,
      },
      effectorRotation: rotation,
      topology: body.topology,
      jointAxes: HUMANOID_JOINT_AXES,
      restFrames: HUMANOID_REST_FRAME,
    });
  const mirror = (pose: IAutoMoviePose): IAutoMoviePose => ({
    ...pose,
    joints: pose.joints.map(
      (j: IAutoMovieJointPose): IAutoMovieJointPose => ({
        ...j,
        bone: TWINS[j.bone] ?? j.bone,
      }),
    ),
  });
  const reflect = (q: IAutoMovieQuaternion): IAutoMovieQuaternion => ({
    x: q.x,
    y: -q.y,
    z: -q.z,
    w: q.w,
  });
  const twist = (pose: IAutoMoviePose): number =>
    pose.joints.find(
      (j: IAutoMovieJointPose): boolean => j.bone === "rightLowerArm",
    )?.twist ?? 0;

  const shoulder: IAutoMovieVector3 =
    frames(rest).get("rightUpperArm")!.worldPosition;
  const reach: IAutoMovieVector3 = Vector3.add(shoulder, {
    x: -0.1,
    y: -0.15,
    z: 0.35,
  });
  const entry: IAutoMoviePose = fit(
    "right",
    {
      ...rest,
      joints: [{ bone: "rightHand", flexion: -20, abduction: -10, twist: 0 }],
    },
    reach,
  );
  const before: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    frames(entry);
  const hand: IAutoMovieQuaternion = before.get("rightHand")!.worldRotation;
  const axis: IAutoMovieVector3 = Vector3.normalize(
    Quaternion.rotateVector(
      before.get("rightLowerArm")!.worldRotation,
      HUMANOID_JOINT_AXES.rightLowerArm!.twist,
    ),
  );
  const across: IAutoMovieVector3 = Vector3.normalize(
    Vector3.cross(axis, { x: 0, y: 1, z: 0 }),
  );
  const demands: readonly (readonly [IAutoMovieVector3, number])[] = [
    [axis, -12],
    [across, 12],
    [Vector3.normalize(Vector3.add(axis, across)), 12],
  ];

  TestValidator.predicate(
    "the wrist takes each demand, the twist its share, the fit mirrored",
    demands.every(
      ([direction, degrees]: readonly [IAutoMovieVector3, number]): boolean => {
        const demand: IAutoMovieQuaternion = Quaternion.normalize(
          Quaternion.multiply(
            Quaternion.fromAxisAngle(direction, degrees),
            hand,
          ),
        );
        const solved: IAutoMoviePose = fit("right", entry, reach, demand);
        const moved: number = Math.abs(twist(solved) - twist(entry));
        const left: IAutoMoviePose = fit(
          "left",
          mirror(entry),
          { ...reach, x: -reach.x },
          reflect(demand),
        );
        const expected: IAutoMoviePose = mirror(solved);
        const angle = (
          pose: IAutoMoviePose,
          bone: AutoMovieHumanoidBone,
          key: "flexion" | "abduction" | "twist",
        ): number =>
          pose.joints.find(
            (j: IAutoMovieJointPose): boolean => j.bone === bone,
          )?.[key] ?? 0;
        return (
          (Quaternion.angle(
            frames(solved).get("rightHand")!.worldRotation,
            demand,
          ) *
            180) /
            Math.PI <=
            TURN &&
          moved <= Math.abs(degrees) + TURN &&
          (direction !== axis || nclose(moved, Math.abs(degrees), TURN)) &&
          (
            [
              "leftUpperArm",
              "leftLowerArm",
              "leftHand",
            ] satisfies AutoMovieHumanoidBone[]
          ).every((bone: AutoMovieHumanoidBone): boolean =>
            (
              ["flexion", "abduction", "twist"] satisfies (
                | "flexion"
                | "abduction"
                | "twist"
              )[]
            ).every((key: "flexion" | "abduction" | "twist"): boolean =>
              nclose(
                angle(left, bone, key),
                angle(expected, bone, key),
                MIRROR,
              ),
            ),
          )
        );
      },
    ),
  );
}
