import type { IAutoMovieQuaternion } from "./IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "./IAutoMovieVector3";

/**
 * Optional rigid mesh placement components applied as per-axis scale, unit
 * quaternion rotation and metre translation. Use finite fields and scales whose
 * output is representable.
 *
 * Normals take inverse scale before rotation and normalization. Texture
 * coordinates are copied unchanged, so a scaling placement preserves the chart
 * measured on the original geometry.
 */
export interface IAutoMovieMeshTransform {
  /**
   * Finite metre offsets added after scale and rotation. Omission gives a zero
   * offset.
   */
  translation?: IAutoMovieVector3;

  /**
   * Finite unit quaternion applied after scale. Omission gives identity, and
   * the norm may differ from one by at most 1e-6.
   */
  rotation?: IAutoMovieQuaternion;

  /**
   * Finite nonzero factors applied first, with unit scale as the default. An
   * odd number of negative factors reverses triangle winding.
   */
  scale?: IAutoMovieVector3;
}
