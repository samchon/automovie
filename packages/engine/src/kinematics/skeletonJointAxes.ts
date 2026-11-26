import {
  AutoMovieHumanoidBone,
  IAutoMovieJointAxes,
  IAutoMovieSkeleton,
} from "@automovie/interface";

/** The empty table returned when neither the bones nor the host declare axes. */
const NO_JOINT_AXES: Partial<
  Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>
> = {};

/**
 * The per-bone clinical axes a skeleton articulates with: each bone's own
 * declared {@link IAutoMovieBone.axes}, then the host's `jointAxes` table.
 *
 * A bone that declares axes describes its own rest frame, so its declaration
 * wins over a table the host chose for a whole family of rigs, such as
 * `HUMANOID_JOINT_AXES`; every other bone keeps the table's entry, and a bone
 * in neither falls through to `DEFAULT_JOINT_AXES` where the caller reads it.
 * Every engine entry that receives both a skeleton and a table, forward or
 * inverse, reads its table through this or applies the same precedence per
 * bone, so pose resolution, baking and the solvers agree on one rig.
 *
 * Returns `jointAxes` itself when no bone declares axes, and a shared frozen
 * empty table when it is also omitted, so the common case allocates nothing;
 * otherwise a new table that the caller owns. The declared axes are not
 * validated here: `validateModel` admits them, and `normalizeJointAxes` throws
 * on a malformed basis where it is used.
 *
 * @param skeleton Rig whose bones may declare axes.
 * @param jointAxes Host table for the bones that declare none.
 */
export function skeletonJointAxes(
  skeleton: IAutoMovieSkeleton,
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
): Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> {
  let merged:
    | Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>
    | undefined;
  for (const bone of skeleton.bones) {
    if (bone.axes === undefined) continue;
    merged ??= { ...jointAxes };
    merged[bone.bone] = bone.axes;
  }
  return merged ?? jointAxes ?? NO_JOINT_AXES;
}
