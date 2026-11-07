import type {
  IAutoMovieBone,
  IAutoMovieModel,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/** Neutral bone transforms in the model frame, using the same unscaled rest FK as pose resolution. */
export function physicalModelRestTransforms(
  model: IAutoMovieModel,
): Map<string, P.ITransform> {
  const transforms: Map<string, P.ITransform> = new Map();
  if (!model.skeleton) return transforms;
  const pending: typeof model.skeleton.bones = [...model.skeleton.bones];
  if (
    new Set(pending.map((bone: (typeof pending)[number]): string => bone.bone))
      .size !== pending.length ||
    pending.filter(
      (bone: (typeof pending)[number]): boolean => bone.parent === null,
    ).length !== 1
  )
    throw new Error("Physical model requires unique bones and one root");
  while (pending.length) {
    const index: number = pending.findIndex(
      (bone: IAutoMovieBone): boolean =>
        bone.parent === null || transforms.has(bone.parent),
    );
    if (index < 0)
      throw new Error("Physical model skeleton is disconnected or cyclic");
    const bone: (typeof pending)[number] = pending.splice(index, 1)[0]!;
    const parent: P.ITransform =
      bone.parent === null
        ? {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
          }
        : transforms.get(bone.parent)!;
    transforms.set(bone.bone, {
      position: Vector3.add(
        parent.position,
        Quaternion.rotateVector(parent.rotation, bone.rest.translation),
      ),
      rotation: Quaternion.multiply(parent.rotation, bone.rest.rotation),
    });
  }
  return transforms;
}
