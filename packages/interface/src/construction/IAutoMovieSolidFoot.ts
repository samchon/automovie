import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/** Data and callback contracts shared by the SolidFoot operations. */
export namespace IAutoMovieSolidFoot {
  /**
     * A locally accepted stationary foot and its world separation from the target.
     *
     * @evidence contracts/development/design.md#principled-representation Chart parameters identify the surface point whose two normalized tangential residuals passed the local solve's criterion.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Two chart scalars, the evaluated world point and distance expose the result without duplicating a surface.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Acceptance certifies finite owned-chart membership and local stationarity, not a global minimum, a positive-definite Hessian or constrained boundary optimum.
     * @evidence contracts/development/common.md#meaningful-documentation Distinguishes chart coordinates from mm world point/distance and labels the result as local.
     */
    export interface IFoot {
      /** Chart parameters. */
      u: number;
  
      /** Chart parameters. */
      v: number;
  
      /** The surface point there, mm. */
      point: AutoMovieVector3Tuple;
  
      /** Distance from the world point, mm. */
      distance: number;
    }
}
