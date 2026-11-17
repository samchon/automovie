import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieBlendColumn } from "./IAutoMovieBlendColumn";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";
import type { IAutoMovieSolidIntersection } from "./IAutoMovieSolidIntersection";
import type { IAutoMovieSolidMesh } from "./IAutoMovieSolidMesh";

/**
 * Periodic ribbon strips and their source-rail correspondence for solid assembly.
 *
 * @evidence contracts/development/design.md#principled-representation World millimetre ribbons become physical-station chain derivatives through the mean rail chord length; phase indexes uniform columns.
 * @evidence contracts/development/design.md#minimal-and-owned-surface BlendChain serves join publication and split/port strip construction, with Body and Clip consuming its shared chart records.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Periodic interpolation and a single outward anchor do not certify global regularity, exact analytic contact or immutable factory frames.
 * @evidence contracts/development/common.md#meaningful-documentation Defines the shared strip purpose, units and publication limitations.
 */
export namespace IAutoMovieSolidBlendChain {
  /**
   * A two-layer blend chain and the column-aligned trim/measurement records
   * used by Body and Clip. Chain station is w*length in mm; chain phase phi
   * names trace parameter seed+phi. Layer frame/zero-jet records are shared
   * factory objects, so mutating them can affect other published blends.
   *
   * @evidence contracts/development/design.md#principled-representation One column ordering ties the interpolated ribbon chain to its two rail charts, direction observations, intersection points and width readings; between-column interpolation is not an exact analytic-surface certificate.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A data record publishes geometry and its source correspondence without retaining the join's query API or another tessellated representation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The type proves neither regular G2 contact nor global orientation/trim correctness. The producer's shared mutable frame records remain an ownership gap, not a guarantee of detached output.
   * @evidence contracts/development/common.md#meaningful-documentation Gives the station/phase mapping, physical units, loop correspondence and shared-frame mutation consequence.
   */
  export interface IBlend {
    /** The chain. */
    chain: IAutoMovieLoftChain;

    /** Its station span `L`, mm: the share `w` is `station / L`. */
    length: number;

    /** The curve parameter of the chain's phase 0, radians (`AutoMovieSolidIntersection.IPoint.t`). */
    seed: number;

    /** The host's rail at the columns, as a trim of the host's face. */
    host: IAutoMovieSolidMesh.ILoopChart;

    /** The part's rail at the columns, as a trim of the part's face. */
    part: IAutoMovieSolidMesh.ILoopChart;

    /**
     * The host's chart direction at each column from the curve's preimage
     * toward its rail, of unit world speed: the host continues past its rail
     * at `host.chart[k] + sigma across[k]`, `sigma > 0` in millimetres.
     */
    across: [number, number][];

    /**
     * The part's chart direction at each column from the curve's preimage
     * toward its rail, of unit world speed at the preimage
     * (`AutoMovieSolidRail.IRail.partAcross`): the part continues past its
     * rail along it.
     */
    partAcross: [number, number][];

    /** The intersection curve's point at each column, mm. */
    curve: [number, number, number][];

    /** The declared chords at each column, mm (`AutoMovieSolidJoin.IJoin.widths`); the part's null where its rail is one fixed station. */
    widths: {
      /** Declared host-side chord width in millimetres at each corresponding column, in the blend's phase order. */
      host: number[];

      /** Declared part-side chord width in millimetres at each column, or null for a rail constrained to one fixed station. */
      part: (number | null)[];
    };

    /** The kind of the curve's parameter (`AutoMovieSolidIntersection.Parameter`). */
    parameter: IAutoMovieSolidIntersection.Parameter["kind"];

    /** The part's kept side in its station: the part continues past its rail at `s + sigma d`, `d > 0` (the phase parameter). */
    sigma: 1 | -1;
  }

  /**
   * Uniform phase columns at 2pi*k/count, each pairing two world-space ribbons.
   * Cross derivatives are with respect to one dimensionless share from start to
   * end. strip divides first and second orders by its mean chord length and its
   * square to form millimetre-station derivatives. Input vectors are read during
   * interpolation; resulting coefficient arrays are new.
   *
   * @evidence contracts/development/design.md#principled-representation Each paired total2 ribbon fixes one quintic cross-section with common start/end derivative orientation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Join columns and SplitBand ribbons enter the same BlendChain.strip implementation structurally.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts strip rejects a nonpositive/nonfinite mean span but relies on compatible finite columns and spline admission; an empty list yields null through its invalid mean.
   * @evidence contracts/development/common.md#meaningful-documentation States column clock, cross-share derivatives, physical scaling and input/result ownership.
   */
  export type IStripColumns = readonly IAutoMovieBlendColumn[];

  /**
   * Optional interior cross-sections in the same phase-column order as the rails.
   * Empty means a two-layer strip. Each section supplies one world-space point
   * and first/second cross-share partial per rail column; strip uses t*length as
   * its station and scales derivatives exactly as at the boundary rails.
   *
   * @evidence contracts/development/design.md#principled-representation A dimensionless interior share and complete per-column total2 data define additional quintic-Hermite layers.
   * @evidence contracts/development/design.md#minimal-and-owned-surface SplitBand's port profiles supply these sections to the existing strip factory.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Strictly increasing interior shares, matching column counts and finite vectors are caller premises; this alias does not validate them.
   * @evidence contracts/development/common.md#meaningful-documentation Gives empty behavior, units, phase alignment and station/derivative conversion.
   */
  export type IStripInner = readonly {
    /** Interior dimensionless share of the physical chord span, strictly between 0 and 1 and increasing across the supplied sections; caller owns this premise. */
    t: number;

    /** One [point, first cross partial, second cross partial] triple per phase column, in world millimetres per the corresponding cross-share order. */
    jets: readonly [
      AutoMovieVector3Tuple,
      AutoMovieVector3Tuple,
      AutoMovieVector3Tuple,
    ][];
  }[];

  /**
   * Published strip chain and its mean paired-rail chord length, or null when
   * that span or the start-column outward-orientation anchor is unusable.
   * Successful layers own new coefficient arrays but share the factory LEVEL
   * frame and STILL derivative frames across layers and other returned strips.
   * Treat these frame records as immutable; no deep copy or freeze is provided.
   *
   * @evidence contracts/development/design.md#principled-representation Nullable publication separates unusable geometry from a chain with a finite positive millimetre span.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Join and SplitBand consumers use the same chain and length for surface construction and trim cycles.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A single orientation anchor does not certify the whole strip, and shared mutable factory frames remain an ownership limitation.
   * @evidence contracts/development/common.md#meaningful-documentation States null conditions, length units and new versus shared result data.
   */
  export type IStripResult = {
    /** New periodic strip chain with station span [0,length]; shared factory frame objects remain subject to the documented alias-mutation limitation. */
    chain: IAutoMovieLoftChain;

    /** Positive finite mean distance between paired rail points, in millimetres; null replaces the entire result when this span or the orientation anchor is unusable. */
    length: number;
  } | null;
}
