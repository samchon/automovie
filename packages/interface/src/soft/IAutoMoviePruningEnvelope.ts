import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The volume a plant is kept inside.
 *
 * A branch whose base is outside is not grown; an analytic exit before its
 * endpoint cuts the centreline, and children whose emergence lies beyond that
 * cut are omitted. Direct-square and quadratic arithmetic retain binary64
 * overflow and cancellation limits. This changes the shared derived structure
 * rather than applying renderer-only clipping. Installation admission reads its
 * canopy bounds; quantity take-off currently does not measure planting.
 */
export type IAutoMoviePruningEnvelope =
  | IAutoMoviePruningEnvelope.INone
  | IAutoMoviePruningEnvelope.IBox
  | IAutoMoviePruningEnvelope.ISphere;
/** Analytic recipe-frame branch-centreline pruning alternatives. */
export namespace IAutoMoviePruningEnvelope {
  /** Unpruned branching structure. */
  export interface INone {
    /** Discriminator. */
    kind: "none";
  }

  /** Axis-aligned recipe-frame pruning box. */
  export interface IBox {
    /** Discriminator. */
    kind: "box";

    /** Minimum corner. */
    min: IAutoMovieVector3;

    /** Maximum corner, strictly greater on every axis. */
    max: IAutoMovieVector3;
  }

  /** Recipe-frame spherical pruning envelope. */
  export interface ISphere {
    /** Discriminator. */
    kind: "sphere";

    /** Centre in the recipe frame. */
    center: IAutoMovieVector3;

    /** Strictly positive radius in metres. */
    radius: number;
  }
}
