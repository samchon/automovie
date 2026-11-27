import { AutoMovieEngineTransform } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTurnHumanPosture,
  IAutoMoviePose,
} from "@automovie/interface";

import { prepareHumanPostureProjection } from "./prepareHumanPostureProjection";
import { turnHumanPosture } from "./turnHumanPosture";

/*
 * Assemble and clamp a posture's direct canonical joints before limb fitting.
 * Last base records supply unset joints, and clinical zero supplies the rest.
 * Whole-body turning retains its original pre-clamp goal admission order.
 */
export function assembleHumanPosture(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  base?: IAutoMoviePose,
  projection?: ReturnType<typeof prepareHumanPostureProjection>,
): IAssembleHumanPostureResult {
  let kept: Map<AutoMovieHumanoidBone, IAutoMovieJointPose> | undefined;
  if (base !== undefined) {
    kept = new Map();
    for (const joint of base.joints) kept.set(joint.bone, joint);
  }

  // The body's projector clamps one joint at a time, and its angle-taking
  // form makes a direct joint's clamped record from the posture's three
  // angles, without first making the record it clamps; a base record and a
  // joint left at zero go through the record clamp, as before.
  const clamp: ReturnType<typeof prepareHumanPostureProjection.joints> =
    prepareHumanPostureProjection.joints(body, body.projection);
  const value: ReturnType<typeof prepareHumanPostureProjection.values> =
    clamp === undefined
      ? undefined
      : prepareHumanPostureProjection.values(body, body.projection);
  if (clamp !== undefined && value !== undefined) {
    // The turn first, as below, so a goal the turn refuses is refused before
    // any clamp runs.
    const turned: IAutoMovieMotionHumanTurnHumanPosture.ITurned =
      turnHumanPosture(posture);
    const root: NonNullable<IAutoMoviePose["root"]> = AutoMovieEngineTransform.of(
      { ...turned.position },
      turned.rotation,
    );
    const joints: IAutoMovieJointPose[] = body.skeleton.bones.map(
      (bone: IAutoMovieBone): IAutoMovieJointPose => {
        const set: readonly [number, number, number] | undefined =
          posture.joints[bone.bone];
        return set === undefined
          ? clamp(
              kept?.get(bone.bone) ?? {
                bone: bone.bone,
                flexion: 0,
                abduction: 0,
                twist: 0,
              },
            )
          : value(bone.bone, set[0], set[1], set[2]);
      },
    );
    return {
      pose: { skeleton: body.skeleton.id, root, joints },
      limbs: turned.limbs,
    };
  }
  const joints: IAutoMovieJointPose[] = body.skeleton.bones.map(
    (bone: IAutoMovieBone): IAutoMovieJointPose => {
      const set: readonly [number, number, number] | undefined =
        posture.joints[bone.bone];
      return set === undefined
        ? (kept?.get(bone.bone) ?? {
            bone: bone.bone,
            flexion: 0,
            abduction: 0,
            twist: 0,
          })
        : {
            bone: bone.bone,
            flexion: set[0],
            abduction: set[1],
            twist: set[2],
          };
    },
  );
  const turned: IAutoMovieMotionHumanTurnHumanPosture.ITurned =
    turnHumanPosture(posture);
  const root: NonNullable<IAutoMoviePose["root"]> = AutoMovieEngineTransform.of(
    { ...turned.position },
    turned.rotation,
  );

  // A body whose projector lends no joint owner projects the pose whole.
  if (clamp === undefined)
    return {
      pose: prepareHumanPostureProjection.project(
        body,
        { skeleton: body.skeleton.id, root, joints },
        projection,
      ),
      limbs: turned.limbs,
    };
  for (let i: number = 0; i < joints.length; ++i) joints[i] = clamp(joints[i]!);
  return {
    pose: { skeleton: body.skeleton.id, root, joints },
    limbs: turned.limbs,
  };
}

/*
 * The record of `IAssembleHumanPostureResult`'s site.
 */
type IAssembleHumanPostureResult = {
  pose: IAutoMoviePose;
  limbs: IAutoMovieMotionHumanPosture["limbs"];
};
