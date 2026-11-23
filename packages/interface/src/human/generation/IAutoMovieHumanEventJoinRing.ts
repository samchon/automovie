import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/**
 * Type contracts exchanged by AutoMovieHumanEventJoinRing; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanEventJoinRing exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups IRing, ParentRingArcs, NearestResult. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanEventJoinRing; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the IRing, ParentRingArcs, NearestResult contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanEventJoinRing {
  /** Dense parent ring at an event and the arc weight of a phase on it.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Dense parent ring at an event and the arc weight of a phase on it.
   * @evidence contracts/development/design.md#principled-representation `sp`: The parent's station at the event, mm. `points`: The ring's samples at uniform phases, mm. `length`: Length along the ring up to each sample, one more entry than the samples.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanEventJoinRing.parentRing. Read by AutoMovieHumanEventJoinRing.nearest.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `sp`, `points`, `length`, `weight`; callers supply the complete record.
   */
  export interface IRing {
    /** The parent's station at the event, mm. */
    sp: number;

    /** The ring's samples at uniform phases, mm. */
    points: AutoMovieVector3Tuple[];

    /** Length along the ring up to each sample, one more entry than the samples. */
    length: number[];

    /**
     * Weight of a phase on the child's arcs, 0 off them and fading to 0 before each pinch.
     */
    weight: (t: number) => number;
  }

  /** The arcs argument of AutoMovieHumanEventJoinRing.parentRing. The parent's ring at an event and the weight of its phases on the child's arcs.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The parent's ring at an event and the weight of its phases on the child's arcs.
   * @evidence contracts/development/design.md#principled-representation The parent's ring at an event and the weight of its phases on the child's arcs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanEventJoinRing.ParentRingArcs is the canonical exchange used by AutoMovieHumanEventJoinRing.parentRing.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanEventJoinRing.parentRing for the parent's ring at an event and the weight of its phases on the child's arcs.
   */
  export type ParentRingArcs = [number, number][];

  /** Result of AutoMovieHumanEventJoinRing.nearest. Nearest point of a dense ring to p: its phase, the point on the closer
  neighbouring segment, the distance, and the nearest sample's index.
  A caller walking a ring in order passes the sample it found last as
  `guess`: its distance bounds the scan from the first step, so the arc
  length bound passes over almost every sample.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Nearest point of a dense ring to p: its phase, the point on the closer neighbouring segment, the distance, and the nearest sample's index.
 * @evidence contracts/development/design.md#principled-representation Nearest point of a dense ring to p: its phase, the point on the closer neighbouring segment, the distance, and the nearest sample's index. Ordered tuple slots are 0, 1, 2, 3; fixed arity preserves their correspondence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanEventJoinRing.NearestResult is the canonical exchange used by AutoMovieHumanEventJoinRing.nearest.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanEventJoinRing.nearest for nearest point of a dense ring to p: its phase, the point on the closer neighbouring segment, the distance, and the nearest sample's index.
 */
  export type NearestResult = [number, AutoMovieVector3Tuple, number, number];
}
