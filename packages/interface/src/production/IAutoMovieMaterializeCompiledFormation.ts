import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieFormationDesign } from "./IAutoMovieFormationDesign";
import type { IAutoMovieWorldSurface } from "./IAutoMovieWorldSurface";

/**
 * Data and callback contracts shared by the MaterializeCompiledFormation operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Compile one formation design into its compact, regenerable runtime record. Member documentation states the supplied records, units and absence meanings used by materializeCompiledFormation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Compact placement and terrain laws remain in canonical formation contracts; supplied radii are host estimates, with the documented base/0.5m fallbacks rather than an asserted enclosure proof.
 * @evidence contracts/development/design.md#principled-representation formation supplies layout, world placement, heading and seed; optional models, metre-valued projectionRadii and ordered surfaces supply compilation context.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieMaterializeCompiledFormation, used by materializeCompiledFormation. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieMaterializeCompiledFormation {
  /**
   * Compile one formation design into its compact, regenerable runtime record.
   *
   * The record stores what regenerates the members rather than the members: the
   * layout, anchor, heading and seed, one bounds and centroid per chunk of
   * {@link AUTOMOVIE_FORMATION_CHUNK_SIZE} slots with that chunk's anonymous
   * count once heroes are excluded, each hero's promoted base transform, the
   * anonymous representation tiers the design declares, a measured or fallback member radius, a
   * domain-separated motion phase seed, and a digest of every other field.
   *
   * The terrain it snapshots is the part of the world that can be under a member:
   * the surfaces whose ground-plan extent reaches the footprint measured on level
   * ground, in declared order. Relief moves members up and down, never sideways,
   * so that footprint holds on any terrain, and a unit with nothing under it
   * reuses the level pass as its finished summary.
   *
   * Supplied member radius estimates come from the host as a table. The host owns model geometry and any enclosure proof; this kernel does not verify estimates against geometry. Missing tier estimates borrow the base estimate, then 0.5m.
   * The digest is SHA-256 over canonical
   * JSON v2 computed without a Node built-in, equal to the Node builder's digest
   * of the same canonical bytes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Compile one formation design into its compact, regenerable runtime record. Member documentation states the supplied records, units and absence meanings used by materializeCompiledFormation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Compact placement and terrain laws remain in canonical formation contracts; supplied radii are host estimates, with the documented base/0.5m fallbacks rather than an asserted enclosure proof.
   * @evidence contracts/development/design.md#principled-representation formation supplies layout, world placement, heading and seed; optional models, metre-valued projectionRadii and ordered surfaces supply compilation context.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieMaterializeCompiledFormation.IProps, used by materializeCompiledFormation. Its formation, models, projectionRadii, surfaces members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
   */
  export type IProps = {
    /** Formation design to compile. */
    formation: IAutoMovieFormationDesign;
    /** Model groups keyed by the id the formation and its tiers name, hashed into each tier's digest; empty when none are supplied. */
    models?: ReadonlyMap<string, IAutoMovieModel>;
    /**
     * Supplied root-centered radius estimate in metres keyed by model group id; an id without one borrows the base group's radius and then half a metre.
     */
    projectionRadii?: ReadonlyMap<string, number>;
    /** World terrain in declared order; empty when the world has none. */
    surfaces?: readonly IAutoMovieWorldSurface[];
  };
}
