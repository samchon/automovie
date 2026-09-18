import { IAutoMovieModel, IAutoMovieVector3 } from "@automovie/interface";
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
 * @evidence requirements/motion/contact-weight-and-support.md#motion-weight-cues Computes the model center-of-mass proxy from authored physical geometry.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Produces the support-relevant center used to express weight and load transfer.
 * @author Samchon
 */
export const deriveCenterOfMass = (
  model: IAutoMovieModel,
): IAutoMovieVector3 | null => {
  let total = 0;
  let weighted: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const part of model.parts) {
    if (part.geometry.type !== "primitive") continue;
    const transform = part.transform ?? IDENTITY;
    const volume =
      primitiveVolume(part.geometry.shape) * scaleVolume(transform);
    if (volume <= 0) continue;
    const centroid = applyTransform(
      transform,
      primitiveCentroid(part.geometry.shape),
    );
    weighted = Vector3.add(weighted, Vector3.scale(centroid, volume));
    total += volume;
  }
  return total > 0 ? Vector3.scale(weighted, 1 / total) : null;
};
