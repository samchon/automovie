import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The volume a plant is kept inside.
 *
 * A branch whose base is outside is not grown; an analytic exit before its endpoint cuts the centreline, and children whose emergence lies beyond that cut are omitted. Direct-square and quadratic arithmetic retain binary64 overflow and cancellation limits. This changes the shared derived structure rather than applying renderer-only clipping. Installation admission reads its canopy bounds; quantity take-off currently does not measure planting.
 *
 * @evidence contracts/common.md#principled-implementation growPlanting tests branch bases and computes box slab exits or sphere quadratic exits in the recipe frame; children beyond the clipped branch length are omitted.
 * @evidence contracts/common.md#clear-and-simple-design The union exposes the two implemented analytic clipping volumes and an explicit unpruned arm.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The envelope clips branch centreline structure, not leaf blades or branch thickness; it is not a full canopy containment guarantee.
 * @evidence contracts/common.md#meaningful-documentation Arm comments state the recipe frame, strict box ordering and metre radius, with the structure-only pruning limit.
 * @author Samchon
 */
export type IAutoMoviePruningEnvelope =
  | IAutoMoviePruningEnvelope.INone
  | IAutoMoviePruningEnvelope.IBox
  | IAutoMoviePruningEnvelope.ISphere;
export namespace IAutoMoviePruningEnvelope {
  /**
   * Unpruned branching structure.
   *
   * @evidence contracts/common.md#principled-implementation growPlanting treats every base as inside and returns no exit for this arm; growth stage and recursion budgets still limit the result.
   * @evidence contracts/common.md#clear-and-simple-design A single literal distinguishes absence of pruning without an infinite box.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The arm removes only pruning; it does not bypass branch and leaf caps.
   * @evidence contracts/common.md#meaningful-documentation The discriminator states that no clipping envelope participates in structural derivation.
   * @author Samchon
   */
  export interface INone {
    /** Discriminator. */
    kind: "none";
  }

  /**
   * Axis-aligned recipe-frame pruning box.
   *
   * @evidence contracts/common.md#principled-implementation A branch based inside the box exits at the nearest forward slab intersection; zero direction components contribute no crossing.
   * @evidence contracts/common.md#clear-and-simple-design Minimum and maximum corners are the complete box parameters consumed by the analytic clipper.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Clipping uses the declared corners rather than sampled cuts; equality at a boundary is inside and branch thickness is not tested.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies the recipe frame and the required strictly ordered corners.
   * @author Samchon
   */
  export interface IBox {
    /** Discriminator. */
    kind: "box";

    /** Minimum corner. */
    min: IAutoMovieVector3;

    /** Maximum corner, strictly greater on every axis. */
    max: IAutoMovieVector3;
  }

  /**
   * Recipe-frame spherical pruning envelope.
   *
   * @evidence contracts/common.md#principled-implementation growPlanting uses squared-distance inclusion and the positive quadratic exit root for a normalized branch axis starting inside the sphere.
   * @evidence contracts/common.md#clear-and-simple-design Centre and radius express the only parameters needed by the analytic sphere clipper.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The radius is validated positive; clipping is centreline-only and does not bound leaf blades extending beyond it.
   * @evidence contracts/common.md#meaningful-documentation The centre is recipe-local and the radius is measured in metres before instance scaling.
   * @author Samchon
   */
  export interface ISphere {
    /** Discriminator. */
    kind: "sphere";

    /** Centre in the recipe frame. */
    center: IAutoMovieVector3;

    /** Strictly positive radius in metres. */
    radius: number;
  }
}
