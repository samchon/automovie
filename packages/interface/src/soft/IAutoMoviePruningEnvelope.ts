import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The volume a plant is kept inside.
 *
 * A branch whose base is outside is not grown; an analytic exit before its endpoint cuts the centreline, and children whose emergence lies beyond that cut are omitted. Direct-square and quadratic arithmetic retain binary64 overflow and cancellation limits. This changes the shared derived structure rather than applying renderer-only clipping. Installation admission reads its canopy bounds; quantity take-off currently does not measure planting.
 *
 * @evidence contracts/development/design.md#principled-representation growPlanting tests branch bases and computes box slab exits or sphere quadratic exits in the recipe frame; children beyond the clipped branch length are omitted.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The union exposes the two implemented analytic clipping volumes and an explicit unpruned arm.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The envelope clips branch centreline structure, not leaf blades or branch thickness; it is not a full canopy containment guarantee.
 * @evidence contracts/development/common.md#meaningful-documentation Arm comments state the recipe frame, strict box ordering and metre radius, with the structure-only pruning limit.
 */
export type IAutoMoviePruningEnvelope =
  | IAutoMoviePruningEnvelope.INone
  | IAutoMoviePruningEnvelope.IBox
  | IAutoMoviePruningEnvelope.ISphere;
export namespace IAutoMoviePruningEnvelope {
  /**
   * Unpruned branching structure.
   *
   * @evidence contracts/development/design.md#principled-representation growPlanting treats every base as inside and returns no exit for this arm; growth stage and recursion budgets still limit the result.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A single literal distinguishes absence of pruning without an infinite box.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The arm removes only pruning; it does not bypass branch and leaf caps.
   * @evidence contracts/development/common.md#meaningful-documentation The discriminator states that no clipping envelope participates in structural derivation.
   */
  export interface INone {
    /** Discriminator. */
    kind: "none";
  }

  /**
   * Axis-aligned recipe-frame pruning box.
   *
   * @evidence contracts/development/design.md#principled-representation A branch based inside the box exits at the nearest forward slab intersection; zero direction components contribute no crossing.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Minimum and maximum corners are the complete box parameters consumed by the analytic clipper.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Clipping uses the declared corners rather than sampled cuts; equality at a boundary is inside and branch thickness is not tested.
   * @evidence contracts/development/common.md#meaningful-documentation The comment identifies the recipe frame and the required strictly ordered corners.
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
   * @evidence contracts/development/design.md#principled-representation growPlanting uses squared-distance inclusion and the positive quadratic exit root for a normalized branch axis starting inside the sphere.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Centre and radius express the only parameters needed by the analytic sphere clipper.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The radius is validated positive; clipping is centreline-only and does not bound leaf blades extending beyond it.
   * @evidence contracts/development/common.md#meaningful-documentation The centre is recipe-local and the radius is measured in metres before instance scaling.
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
