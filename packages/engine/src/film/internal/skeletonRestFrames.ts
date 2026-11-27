import {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";

/*
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
 */
export function skeletonRestFrames(
  skeleton: IAutoMovieSkeleton,
): ReadonlyMap<
  AutoMovieHumanoidBone,
  Pick<IAutoMovieTransform, "translation" | "rotation">
> {
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
  function resolve(
    name: AutoMovieHumanoidBone,
  ): Pick<IAutoMovieTransform, "translation" | "rotation"> {
    const cached:
      | Pick<IAutoMovieTransform, "translation" | "rotation">
      | undefined = frames.get(name);
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
        translation: AutoMovieEngineVector3.add(
          parent.translation,
          AutoMovieEngineQuaternion.rotateVector(parent.rotation, bone.rest.translation),
        ),
        rotation: AutoMovieEngineQuaternion.multiply(parent.rotation, bone.rest.rotation),
      };
    }
    resolving.delete(name);
    frames.set(name, frame);
    return frame;
  }
  for (const bone of skeleton.bones) resolve(bone.bone);
  return frames;
}
