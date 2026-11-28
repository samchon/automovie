import type { IAutoMovieVector3 } from "./IAutoMovieVector3";

/**
 * Borrowed differential mask sample at one original mesh vertex.
 *
 * Supply one sample for every original vertex in position-buffer order. The
 * supplied gradient describes the same mask as the weight. The caller owns mask
 * behavior between sampled vertices.
 */
export interface IAutoMovieMeshDeformationInfluence {
  /**
   * Finite dimensionless mask in [0, 1]. A zero weight retains the original
   * position, while the gradient can still affect local normal transport.
   */
  weight: number;

  /**
   * Finite spatial derivative of the mask in inverse metres in the mesh frame.
   * Its outer product with displacement affects the Jacobian.
   */
  gradient: IAutoMovieVector3;
}
