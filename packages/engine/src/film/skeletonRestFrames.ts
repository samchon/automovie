import {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * Every bone's rest-pose frame in model space, composed down the parent chain.
 *
 * A bone's frame is its parent's frame composed with its own rest translation
 * and rotation: `translation = parent.translation + parent.rotation ·
 * rest.translation` and `rotation = parent.rotation ∘ rest.rotation`. Rigs keep
 * unit scale, which Engine FK and the viewer both assume, so translation and
 * rotation are the whole transform. Units are the rig's metres.
 *
 * Throws when a bone name is duplicated, a parent is not declared, or the
 * parent links form a cycle, because a rest frame measured from a malformed rig
 * would silently misplace whatever is measured against it.
 *
 * @evidence contracts/common.md#principled-implementation Composes each rest transform onto its parent's by quaternion rotation and multiplication, the forward-kinematics rule `resolvePose` applies at zero joint angles; the memo map makes each bone's frame depend only on its declared ancestors, and the in-progress set turns a parent cycle into an error rather than unbounded recursion.
 * @evidence contracts/common.md#clear-and-simple-design The one rest-frame walk that `computeModelRestExtent` and `computeRestHeight` both read, so the drawn-geometry extent and the joint span cannot compose a bone differently; `resolvePose` is not reused because it drops unreachable bones where these measurements must refuse them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no rig or bone; every malformed-rig case throws with the bone path instead of being skipped, and nothing compensates for a measurement downstream.
 * @evidence contracts/common.md#meaningful-documentation States the composition formula, the unit-scale premise and why it holds, the frame and unit of the result, and each throwing case with its reason.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the bone count B: one pass indexes names, and memoized recursion resolves each bone once, O(B) time and space; recursion depth is the deepest parent chain.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one skeleton; it memoizes within the call, and a caller measuring one rig repeatedly owns any cross-call reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds its name index and in-progress set only for the call; the returned map, one frame per bone, belongs to the caller.
 */
export const skeletonRestFrames = (
  skeleton: IAutoMovieSkeleton,
): ReadonlyMap<
  AutoMovieHumanoidBone,
  Pick<IAutoMovieTransform, "translation" | "rotation">
> => {
  const byName: Map<
    AutoMovieHumanoidBone,
    { bone: IAutoMovieBone; index: number }
  > = new Map();
  skeleton.bones.forEach((bone: IAutoMovieBone, index: number): void => {
    const existing: { bone: IAutoMovieBone; index: number } | undefined =
      byName.get(bone.bone);
    if (existing !== undefined)
      throw new Error(
        `skeleton "${skeleton.id}" bone "${bone.bone}" is duplicated at bones[${index}].bone; first declared at bones[${existing.index}].bone`,
      );
    byName.set(bone.bone, { bone, index });
  });
  const frames: Map<
    AutoMovieHumanoidBone,
    Pick<IAutoMovieTransform, "translation" | "rotation">
  > = new Map();
  const resolving: Set<AutoMovieHumanoidBone> = new Set();
  const resolve = (
    name: AutoMovieHumanoidBone,
  ): Pick<IAutoMovieTransform, "translation" | "rotation"> => {
    const cached: Pick<IAutoMovieTransform, "translation" | "rotation"> | undefined =
      frames.get(name);
    if (cached !== undefined) return cached;
    if (resolving.has(name))
      throw new Error(
        `skeleton "${skeleton.id}" bone parent cycle includes "${name}"`,
      );
    const entry: { bone: IAutoMovieBone; index: number } | undefined =
      byName.get(name);
    if (entry === undefined)
      throw new Error(
        `skeleton "${skeleton.id}" bone "${name}" was not provided`,
      );
    resolving.add(name);
    const bone: IAutoMovieBone = entry.bone;
    let frame: Pick<IAutoMovieTransform, "translation" | "rotation">;
    if (bone.parent === null)
      frame = {
        translation: bone.rest.translation,
        rotation: bone.rest.rotation,
      };
    else {
      const parent: Pick<IAutoMovieTransform, "translation" | "rotation"> =
        resolve(bone.parent);
      frame = {
        translation: Vector3.add(
          parent.translation,
          Quaternion.rotateVector(parent.rotation, bone.rest.translation),
        ),
        rotation: Quaternion.multiply(parent.rotation, bone.rest.rotation),
      };
    }
    resolving.delete(name);
    frames.set(name, frame);
    return frame;
  };
  for (const bone of skeleton.bones) resolve(bone.bone);
  return frames;
};
