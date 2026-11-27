import type { IAutoMovieQuaternion } from "./IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "./IAutoMovieVector3";

/**
 * A placement of a rigid mesh: per-axis scale first, then a unit-quaternion
 * rotation, then a translation, as `transformMesh` applies it.
 *
 * Normals take the inverse transpose of the scale and rotation, and a scale
 * with a negative product flips triangle winding. UVs ride along unchanged, so
 * a scaled placement leaves metric texture coordinates measuring the unscaled
 * surface. `transformMesh` throws on a non-finite field, a rotation
 * whose norm differs from one by more than 1e-6, and a zero scale component.
 */
export interface IAutoMovieMeshTransform {
  /** Metres added after scale and rotation; omitted means no translation. */
  translation?: IAutoMovieVector3;

  /**
   * Unit quaternion applied after scale; omitted means identity. A norm off by
   * more than 1e-6 is refused.
   */
  rotation?: IAutoMovieQuaternion;

  /**
   * Nonzero per-axis factors applied first; omitted means unit scale. A
   * negative product mirrors the mesh and flips its winding.
   */
  scale?: IAutoMovieVector3;
}
