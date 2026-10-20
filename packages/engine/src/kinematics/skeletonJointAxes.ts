import {
  AutoMovieHumanoidBone,
  IAutoMovieJointAxes,
  IAutoMovieSkeleton,
} from "@automovie/interface";

/** The empty table returned when neither the bones nor the host declare axes. */
const NO_JOINT_AXES: Partial<
  Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>
> = Object.freeze({});

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
 * otherwise a new table that the caller owns. The declared axes are not validated here: `validateModel`
 * admits them, and `normalizeJointAxes` throws on a malformed basis where it
 * is used.
 *
 * @param skeleton Rig whose bones may declare axes.
 * @param jointAxes Host table for the bones that declare none.
 *
 * @evidence contracts/common.md#principled-implementation A precedence merge of two partial maps keyed by bone, where the bone's own declaration overrides the host table because it describes the bone's actual rest frame; it premises unique bone names, which validateModel admits.
 * @evidence contracts/common.md#clear-and-simple-design One owner of the precedence rule, called at each engine entry that receives both a skeleton and a table, so no caller repeats the lookup order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No bone or rig is special-cased; a skeleton without declarations returns the host table unchanged, which keeps every existing result identical.
 * @evidence contracts/common.md#meaningful-documentation States the precedence, the fallback to the default basis, the identity and empty returns and their ownership, and where the declared axes are validated.
 * @evidence contracts/performance.md#efficient-algorithms One scan of the bones; a copy of the table is made only when a bone declares axes, linear in the table and bone counts.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of its two arguments; callers that resolve many poses of one rig can hold the result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the returned table borrows the declared axis records.
 */
export const skeletonJointAxes: (
  skeleton: IAutoMovieSkeleton,
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
) => Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> = (
  skeleton: IAutoMovieSkeleton,
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
): Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> => {
  let merged:
    | Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>
    | undefined;
  for (const bone of skeleton.bones) {
    if (bone.axes === undefined) continue;
    merged ??= { ...jointAxes };
    merged[bone.bone] = bone.axes;
  }
  return merged ?? jointAxes ?? NO_JOINT_AXES;
};
