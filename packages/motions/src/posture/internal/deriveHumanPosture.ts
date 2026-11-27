import { AutoMovieEngineTransform } from "@automovie/engine";
import type {
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieMotionHumanTurnHumanPosture,
  IAutoMoviePose,
} from "@automovie/interface";

import { prepareHumanPostureProjection } from "./prepareHumanPostureProjection";
import { resolveHumanPostureSource } from "./resolveHumanPostureSource";
import { turnHumanPosture } from "./turnHumanPosture";

/*
 * The assembly of a posture, built from the assembly of another posture of the
 * same body: every bone whose direct angles are exactly the other posture's
 * keeps that assembly's clamped record, and only the others are clamped again.
 * A plan that reads one instant under several variations (an arm let out, a
 * root shifted) assembles the instant once and derives the rest.
 * Parameter body: The performer's body.
 * Parameter assembled: An assembly of this body
 * (`resolveHumanPostureSource.assemble`), left unchanged.
 * Parameter posture: The posture to assemble.
 * Returns: The posture's assembly: the pose `assemble` gives it, value for
 * value, sharing every record whose bone's angles did not change, and the
 * root itself when the root and heading did not.
 */
export function deriveHumanPosture(
  body: IAutoMovieMotionHumanBody,
  assembled: resolveHumanPostureSource.IAssembled,
  posture: IAutoMovieMotionHumanPosture,
): resolveHumanPostureSource.IAssembled {
  const from: IAutoMovieMotionHumanPosture = assembled.posture;
  const clamp: ReturnType<typeof prepareHumanPostureProjection.joints> =
    prepareHumanPostureProjection.joints(body, body.projection);
  const before: readonly IAutoMovieJointPose[] = assembled.pose.joints;
  if (
    from.rotation !== undefined ||
    posture.rotation !== undefined ||
    assembled.base !== undefined ||
    assembled.pose.root === null ||
    clamp === undefined ||
    before.length !== body.skeleton.bones.length
  )
    return resolveHumanPostureSource.assemble(body, posture, assembled.base);

  // Each bone's record: the other assembly's where the angles are the same.
  let joints: IAutoMovieJointPose[] | undefined;
  for (let i: number = 0; i < before.length; ++i) {
    const bone: IAutoMovieJointPose["bone"] = body.skeleton.bones[i]!.bone;
    const old: readonly [number, number, number] | undefined =
      from.joints[bone];
    const set: readonly [number, number, number] | undefined =
      posture.joints[bone];
    if (
      old === set ||
      (old !== undefined &&
        set !== undefined &&
        Object.is(old[0], set[0]) &&
        Object.is(old[1], set[1]) &&
        Object.is(old[2], set[2]))
    )
      continue;
    joints ??= before.slice();
    joints[i] = clamp(
      set === undefined
        ? { bone, flexion: 0, abduction: 0, twist: 0 }
        : { bone, flexion: set[0], abduction: set[1], twist: set[2] },
    );
  }

  // The root: the other assembly's own when root and heading are the same.
  const turned: IAutoMovieMotionHumanTurnHumanPosture.ITurned =
    turnHumanPosture(posture);
  const placed: boolean =
    Object.is(from.root.x, posture.root.x) &&
    Object.is(from.root.y, posture.root.y) &&
    Object.is(from.root.z, posture.root.z) &&
    Object.is(from.yaw, posture.yaw) &&
    Object.is(from.pitch, posture.pitch) &&
    Object.is(from.roll, posture.roll);
  const root: NonNullable<IAutoMoviePose["root"]> = placed
    ? assembled.pose.root
    : AutoMovieEngineTransform.of({ ...turned.position }, turned.rotation);
  return {
    posture,
    pose: {
      skeleton: body.skeleton.id,
      root,
      joints: joints ?? assembled.pose.joints,
    },
    limbs: turned.limbs,
  };
}

/*
 * Companion of deriveHumanPosture.
 */
export namespace deriveHumanPosture {
  /*
   * A completed cold fit: the assembly it ran on and what it returned.
   */
  export interface ISolved {
    /*
     * The assembly the fit ran on.
     */
    assembled: resolveHumanPostureSource.IAssembled;

    /*
     * What `resolveHumanPostureSource.fit` returned for that assembly's own
     * goals, with no nearby seed.
     */
    seeded: IAutoMovieMotionHumanResolveHumanPosture.ISeeded;
  }
}
