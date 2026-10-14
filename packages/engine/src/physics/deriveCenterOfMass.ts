import {
  IAutoMovieModel,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { primitiveCentroid } from "./primitiveCentroid";
import { primitiveVolume } from "./primitiveVolume";

/**
 * Volume-weighted center of mass of a model's primitive geometry, in the
 * model's local frame: the fallback the engine uses when
 * {@link IAutoMovieBody.centerOfMass} is left `null`.
 *
 * Uniform density is assumed: each primitive part contributes its analytic
 * solid volume (scaled by its part transform) at its transformed centroid. Mesh
 * parts and zero-volume primitives (a plane, or a non-positive scale)
 * contribute nothing. Returns `null` when the model has no primitive volume to
 * weigh (a mesh-only or all-degenerate model), which is the caller's signal
 * that `centerOfMass` must be declared explicitly.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Sum each supported primitive's volume-weighted centroid after part scale, rotation and translation, using positive scale product as the volume Jacobian. Density is uniform; articulated bone placement and overflowing weighted sums remain limitations.
 * @evidence contracts/common.md#clear-and-simple-design The part scan delegates formulas to primitiveVolume and primitiveCentroid, keeping aggregate weighting in this function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported mesh/plane and nonpositive volumes are omitted by the declared approximation; no consumer or expected center receives a special answer.
 * @evidence contracts/common.md#meaningful-documentation The comment documents model-local metres, uniform density, part TRS, ignored geometry and null when no positive mass proxy exists.
 * @evidence contracts/performance.md#efficient-algorithms P parts require O(P) arithmetic and O(1) aggregate state; each supported part needs one centroid transform, not sampled surface geometry.
 * @evidence contracts/performance.md#reuse-equivalent-work Primitive formulas are shared canonical helpers; no aggregate cache survives mutable part geometry or transform changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary vectors are call-owned and the resulting centroid transfers to the caller; no part history or handle is retained.
 */
export const deriveCenterOfMass: (
  model: IAutoMovieModel,
) => IAutoMovieVector3 | null = (
  model: IAutoMovieModel,
): IAutoMovieVector3 | null => {
  let total: number = 0;
  let weighted: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const part of model.parts) {
    if (part.geometry.type !== "primitive") continue;
    const transform: IAutoMovieTransform = part.transform ?? IDENTITY;
    const volume: number =
      primitiveVolume(part.geometry.shape) * scaleVolume(transform);
    if (volume <= 0) continue;
    const centroid: IAutoMovieVector3 = applyTransform(
      transform,
      primitiveCentroid(part.geometry.shape),
    );
    weighted = Vector3.add(weighted, Vector3.scale(centroid, volume));
    total += volume;
  }
  return total > 0 ? Vector3.scale(weighted, 1 / total) : null;
};

const IDENTITY: IAutoMovieTransform = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};

/** How much a transform's scale multiplies a solid's volume. */
const scaleVolume: (t: IAutoMovieTransform) => number = (
  t: IAutoMovieTransform,
): number => t.scale.x * t.scale.y * t.scale.z;

/** Apply a full TRS transform to a local point. */
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
