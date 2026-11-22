import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieArchetypeRide } from "./AutoMovieArchetypeRide";

/**
 * The contact geometry returned by a towed ride sample.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the two tow-specific contracts and their query scope.
 * @evidence contracts/development/design.md#principled-representation A tow adds one query that serves contacts from its current posed sources.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns the types for AutoMovieArchetypeRide.towed without duplicating ordinary ride fields.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The types retain world points and the existing film clock.
 */
export namespace ArchetypeTowedGeometry {
  /**
   * One tow read, supplying only the selected current material and contact frames.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the tow's world placement, contact frames and material tail at one film second.
   * @evidence contracts/development/design.md#principled-representation A placement and two observations share the posed leader and trailer for one query.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Frame and final line segment serve body contact without constructing the full scene's line output.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the same posed affordances and endpoint resolver as the complete tow scene.
   */
  export interface ITowedSample<Id extends string> {
    /** The towed model's world placement at the requested second. */
    readonly placement: IAutoMovieTransform;
    /**
     * A named trailer affordance's world frame. A missing id keeps the model's refusal.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the affordance input and world-frame result.
     * @evidence contracts/development/implementation.md#principled-implementation Composes the trailer placement with the named frame of the posed trailer.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One affordance lookup and one composition.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing affordance is refused by the same lookup as the full scene reader.
     * @evidence contracts/development/implementation.md#efficient-algorithms Reads one affordance without laying unrelated material or repeating the tow solve.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Borrows the shared current posed trailer and its placement.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains no per-id result or query history.
     */
    frame(id: Id): IAutoMovieTransform;
    /**
     * The two world endpoints of a named line's final segment, in draw order. An unknown line returns undefined.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the line id, endpoint order, world space and absent-line result.
     * @evidence contracts/development/implementation.md#principled-implementation Resolves the final two attachments through the same endpoint function as the full renderer.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Finds the authored line, then places its two final attachments.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the current posed leader and trailer for the endpoints.
     * @evidence contracts/development/implementation.md#efficient-algorithms One line lookup and two endpoint resolutions without laying other lines or earlier attachments.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the placement and posed models of this query with frame and full output.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each segment returned belongs to its caller. The source retains no per-line results.
     */
    tail(
      id: string,
    ): readonly [IAutoMovieVector3, IAutoMovieVector3] | undefined;
  }

  /**
   * A towed ride's demand-driven geometry at an arbitrary film second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes the additional world-frame query over the ordinary ride.
   * @evidence contracts/development/design.md#principled-representation An ordinary ride gains one synchronous arbitrary-time observation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Retains ordinary scene sampling and exposes selected tow geometry to contact readers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the authored leader, trailer, coupling and material definitions.
   */
  export interface ITowedRide<
    Id extends string,
    Dimension extends string,
  > extends AutoMovieArchetypeRide.IRide<Id, Dimension> {
    /**
     * Share the leader and trailer reads among contacts of this film second.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States world outputs, film-clock input and scope of sharing.
     * @evidence contracts/development/implementation.md#principled-implementation Runs the original heading, hitch, trailer and coupling computation before serving current contact demands.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure A single current read prepares both posed models and placement. Its result resolves each later explicit demand.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the existing raw callbacks, their order, the exact geometry and the coupling tolerance.
     * @evidence contracts/development/implementation.md#efficient-algorithms One current tow solve per sample. Line output and endpoints are constructed only on demand.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Posed sources and placement are reused for demands on that completed sample alone.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns this returned snapshot. The ride retains no pose or sample history between calls.
     */
    geometry(seconds: number): ITowedSample<Id>;
  }
}
