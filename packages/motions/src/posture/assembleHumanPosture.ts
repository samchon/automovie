import { Transform } from "@automovie/engine";
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

/**
 * Assemble and clamp a posture's direct canonical joints before limb fitting.
 * Last base records supply unset joints, and clinical zero supplies the rest.
 * Whole-body turning retains its original pre-clamp goal admission order.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines base precedence, zero defaults, root turning and pre-fit clamp order.
 * @evidence contracts/development/implementation.md#principled-implementation Maps every rig bone to the same explicit clinical triple or last base record, turns the original root/goals, then clamps each assembled record in order through the one-joint owner of the body's own pose clamp (`IHumanBody.projection`), the clamp clampPose maps over a pose, before IK.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Moves the existing seeded assembly unchanged into one owner shared by ordinary resolution and fixed-base candidate operations.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every direct joint still enters the actual engine clamp; no range, default, base precedence or goal/plant refusal is changed.
 * @evidence contracts/development/implementation.md#efficient-algorithms Takes O(B+J) joint assembly/indexing plus the actual clamp costs for B rig bones and J base records; a direct joint's clamped record is made from its three angles by the projector's angle-taking form (`prepareHumanPostureProjection.values`, the same record the record clamp gives), one record a joint where a record and its clamp were two; a fixed-base candidate operation can perform this unchanged work once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The returned direct pose/turned goals belong to this actual source assembly. Every assembly of a body clamps through that body's one projector; every actual joint is still projected, and no numerical limb result is prepared or reused here.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Temporary base indexing ends on return/throw; the caller owns the clamped pose and receives borrowed or freshly turned goals, without retained source history or handles.
 */
export function assembleHumanPosture(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  base?: IAutoMoviePose,
  projection?: ReturnType<typeof prepareHumanPostureProjection>,
): { pose: IAutoMoviePose; limbs: IAutoMovieMotionHumanPosture["limbs"] } {
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
    clamp === undefined ? undefined : prepareHumanPostureProjection.values(body, body.projection);
  if (clamp !== undefined && value !== undefined) {
    // The turn first, as below, so a goal the turn refuses is refused before
    // any clamp runs.
    const turned: IAutoMovieMotionHumanTurnHumanPosture.ITurned = turnHumanPosture(posture);
    const root: NonNullable<IAutoMoviePose["root"]> = Transform.of({ ...turned.position }, turned.rotation);
    const joints: IAutoMovieJointPose[] = body.skeleton.bones.map(
      (bone: IAutoMovieBone): IAutoMovieJointPose => {
        const set: readonly [number, number, number] | undefined = posture.joints[bone.bone];
        return set === undefined
          ? clamp(kept?.get(bone.bone) ?? { bone: bone.bone, flexion: 0, abduction: 0, twist: 0 })
          : value(bone.bone, set[0], set[1], set[2]);
      },
    );
    return { pose: { skeleton: body.skeleton.id, root, joints }, limbs: turned.limbs };
  }
  const joints: IAutoMovieJointPose[] = body.skeleton.bones.map(
    (bone: IAutoMovieBone): IAutoMovieJointPose => {
      const set: readonly [number, number, number] | undefined = posture.joints[bone.bone];
      return set === undefined
        ? kept?.get(bone.bone) ?? { bone: bone.bone, flexion: 0, abduction: 0, twist: 0 }
        : { bone: bone.bone, flexion: set[0], abduction: set[1], twist: set[2] };
    },
  );
  const turned: IAutoMovieMotionHumanTurnHumanPosture.ITurned = turnHumanPosture(posture);
  const root: NonNullable<IAutoMoviePose["root"]> = Transform.of({ ...turned.position }, turned.rotation);

  // A body whose projector lends no joint owner projects the pose whole.
  if (clamp === undefined)
    return {
      pose: prepareHumanPostureProjection.project(body, { skeleton: body.skeleton.id, root, joints }, projection),
      limbs: turned.limbs,
    };
  for (let i: number = 0; i < joints.length; ++i) joints[i] = clamp(joints[i]!);
  return { pose: { skeleton: body.skeleton.id, root, joints }, limbs: turned.limbs };
}
