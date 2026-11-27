import {
  IAutoMovieModel,
  type IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { Transform } from "../../math/Transform";
import { Vector3 } from "../../math/Vector3";
import { physicalModelRestTransforms } from "./physicalModelRestTransforms";
import { primitiveCentroid } from "./primitiveCentroid";
import { primitiveVolume } from "./primitiveVolume";

/*
 * Volume-weighted center of mass of a model's primitive geometry, in the
 * model's local frame: the fallback the engine uses when
 * IAutoMovieBody.centerOfMass is left `null`.
 *
 * Uniform density is assumed: each primitive part contributes its analytic
 * solid volume (scaled by its part transform) at its transformed centroid.
 * Attached parts are carried by their bone's neutral model-frame transform.
 * Skeleton rest scale is omitted consistently with the engine's pose FK. Mesh
 * parts and zero-volume primitives (a plane, or a non-positive scale)
 * contribute nothing. Returns `null` when the model has no primitive volume to
 * weigh (a mesh-only or all-degenerate model), which is the caller's signal
 * that `centerOfMass` must be declared explicitly.
 */
export function deriveCenterOfMass(
  model: IAutoMovieModel,
): IAutoMovieVector3 | null {
  let total: number = 0;
  let weighted: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const bones: Map<string, IAutoMovieRigidTransform> =
    physicalModelRestTransforms(model);
  for (const part of model.parts) {
    if (part.geometry.type !== "primitive") continue;
    const transform: IAutoMovieTransform = part.transform ?? IDENTITY;
    const volume: number =
      primitiveVolume(part.geometry.shape) * scaleVolume(transform);
    if (volume <= 0) continue;
    let centroid: IAutoMovieVector3 = applyTransform(
      transform,
      primitiveCentroid(part.geometry.shape),
    );
    if (part.attachedBone !== null && part.attachedBone !== undefined) {
      const bone: ReturnType<typeof bones.get> = bones.get(part.attachedBone);
      if (!bone)
        throw new Error(
          `Center of mass references missing bone ${part.attachedBone}`,
        );
      centroid = Vector3.add(
        bone.position,
        Quaternion.rotateVector(bone.rotation, centroid),
      );
    }
    weighted = Vector3.add(weighted, Vector3.scale(centroid, volume));
    total += volume;
  }
  return total > 0 ? Vector3.scale(weighted, 1 / total) : null;
}

const IDENTITY: IAutoMovieTransform = Transform.identity();

/*
 * How much a transform's scale multiplies a solid's volume.
 */
const scaleVolume: (t: IAutoMovieTransform) => number = (
  t: IAutoMovieTransform,
): number => t.scale.x * t.scale.y * t.scale.z;

/*
 * Apply a full TRS transform to a local point.
 */
const applyTransform: (
  t: IAutoMovieTransform,
  p: IAutoMovieVector3,
) => IAutoMovieVector3 = (
  t: IAutoMovieTransform,
  p: IAutoMovieVector3,
): IAutoMovieVector3 =>
  Vector3.add(
    t.translation,
    Quaternion.rotateVector(t.rotation, {
      x: p.x * t.scale.x,
      y: p.y * t.scale.y,
      z: p.z * t.scale.z,
    }),
  );
