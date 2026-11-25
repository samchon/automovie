import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/** Data and callback contracts shared by the AxisDirection operations. */
export namespace IAutoMovieAxisDirection {
  /**
   * A projected direction and its same-scale norms for unitization and relative
   * conditioning.
   */
  export interface IProjection {
    /** Direction in the original or positively scaled input's normal plane. */
    vector: AutoMovieVector3Tuple;
    /** Norm of vector in that same scale. */
    normalNorm: number;
    /**
     * Full target norm in the same scale; ratio normalNorm/targetNorm drives
     * admission.
     */
    targetNorm: number;
  }
}
