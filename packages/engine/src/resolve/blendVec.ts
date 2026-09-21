import { IAutoMovieVector3 } from "@automovie/interface";
import { Vector3 } from "../math/Vector3";

/**
 * Linearly interpolate two vectors by influence `t`.
 *
 * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-rig-control-drivers Applies a driver's declared influence to a vector-valued transform result.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Implements deterministic influence blending for world-space driver output.
 */
export const blendVec = (
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  t: number,
): IAutoMovieVector3 =>
  Vector3.add(a, Vector3.scale(Vector3.subtract(b, a), t));
