import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The volume a plant is kept inside.
 *
 * A branch whose base is already outside is not grown at all; a branch that
 * crosses the boundary is cut exactly at the crossing, and only the children
 * that emerge before the cut survive. That is pruning, not clipping in the
 * renderer: what the envelope removes is gone from the derived structure every
 * reader of the plant works from. The installation binding's canopy collision
 * check reads that structure today. A quantity take-off would read the same
 * one, and none measures planting yet.
 */
export type IAutoMoviePruningEnvelope =
  | IAutoMoviePruningEnvelope.INone
  | IAutoMoviePruningEnvelope.IBox
  | IAutoMoviePruningEnvelope.ISphere;
export namespace IAutoMoviePruningEnvelope {
  /** Unpruned: the structure grows to its full extent. */
  export interface INone {
    /** Discriminator. */
    kind: "none";
  }

  /** An axis-aligned world box: a trained wall, a clipped hedge, a planter. */
  export interface IBox {
    /** Discriminator. */
    kind: "box";

    /** Minimum corner. */
    min: IAutoMovieVector3;

    /** Maximum corner, strictly greater on every axis. */
    max: IAutoMovieVector3;
  }

  /** A ball: a standard topiary, a hanging sphere. */
  export interface ISphere {
    /** Discriminator. */
    kind: "sphere";

    /** World centre. */
    center: IAutoMovieVector3;

    /** Strictly positive radius in metres. */
    radius: number;
  }
}
