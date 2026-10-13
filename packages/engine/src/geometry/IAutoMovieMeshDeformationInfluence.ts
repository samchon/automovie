import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A caller-owned differential mask sample at one resident mesh vertex.
 *
 * Samples follow the mesh's vertex order. The deformer uses both the mask and
 * its local spatial derivative before checking the composed surface's
 * orientation; a weight alone cannot describe the resulting normal transport.
 * Admission checks finite values and bounded weights, while the caller owns
 * the sampled field's provenance and interpolation between vertices.
 *
 * @author Samchon
 */
export interface IAutoMovieMeshDeformationInfluence {
  /** Dimensionless mask in [0, 1]; zero retains the resident position. */
  weight: number;

  /**
   * Spatial derivative of the mask in inverse metres in the mesh's local frame.
   */
  gradient: IAutoMovieVector3;
}
