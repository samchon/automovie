import type { IAutoMovieVector3 } from "./IAutoMovieVector3";

/**
 * A caller-owned differential mask sample at one resident mesh vertex, passed
 * to the operation `createAutoMovieMeshDeformer` returns.
 *
 * Samples follow the mesh's vertex order, one per vertex. For displacement `d`
 * the masked map is `p + weight * d` and its Jacobian gains `outer(d,
 * gradient)`, so the deformer uses both the mask and its local derivative
 * before checking the composed surface's orientation; a weight alone cannot
 * describe the resulting normal transport. Admission checks the sample count,
 * finite values and bounded weights, while the caller owns the sampled field's
 * provenance and interpolation between vertices.
 */
export interface IAutoMovieMeshDeformationInfluence {
  /** Dimensionless mask in [0, 1]; zero retains the resident position. */
  weight: number;

  /** Spatial derivative of the mask in inverse metres in the mesh's local frame. */
  gradient: IAutoMovieVector3;
}
