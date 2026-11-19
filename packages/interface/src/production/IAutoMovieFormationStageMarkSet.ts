import type { IAutoMovieFormationMotion } from "./IAutoMovieFormationMotion";

/**
 * A timed assignment of floor marks to anonymous members of one formation.
 *
 * All positions are absolute in the fixed formation's local frame. An
 * omitted slot holds its previous mark, or its generated slot before the
 * first assignment. Whole-unit motion keeps ownership of the unit frame.
 *
 * @evidence contracts/development/design.md#principled-representation A common shot interval and unique slot ordinals bind designated floor marks to the members that move to them. Drum Corps International documents such individual field coordinates in its dot-book practice (https://www.dci.org/news/do-you-speak-drum-corps/).
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two local coordinates and an optional facing reuse sparse slot motion without carrying a second runtime movement track.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No member assignment, speed, foot motion or collision route is inferred from formation labels.
 * @evidence contracts/development/common.md#meaningful-documentation States half-open shot timing, local floor metres, held facing and id ownership.
 */
export interface IAutoMovieFormationStageMarkSet {
  /** Nonblank set id; reserve its generated `<id>.slot.<index>` cue ids in the shot. */
  id: string;

  /** Inclusive shot-local start in seconds. */
  start: number;

  /** Exclusive shot-local end in seconds. The final marks hold after it. */
  end: number;

  /** Member interpolation over the interval. The default is linear. */
  easing?: IAutoMovieFormationMotion["easing"];

  /** The nonempty set of assignments, with each anonymous slot named once. */
  marks: readonly {
    /** Zero-based member in the fixed design. */
    slot: number;

    /** Local X coordinate in metres from the unit anchor. */
    lateral: number;

    /** Local Z coordinate in metres from the unit anchor. */
    depth: number;

    /** Facing offset from the member's designed heading, in degrees. Omission holds the prior offset. */
    facingOffsetDeg?: number;
  }[];
}
