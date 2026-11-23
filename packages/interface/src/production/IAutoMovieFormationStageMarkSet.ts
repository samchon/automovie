import type { IAutoMovieFormationMotion } from "./IAutoMovieFormationMotion";

/**
 * A timed assignment of floor marks to anonymous members of one formation.
 *
 * All positions are absolute in the fixed formation's local frame. An omitted
 * slot holds its previous mark, or its generated slot before the first
 * assignment. Whole-unit motion keeps ownership of the unit frame.
 */
export interface IAutoMovieFormationStageMarkSet {
  /**
   * Nonblank set id; reserve its generated `<id>.slot.<index>` cue ids in the
   * shot.
   */
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

    /**
     * Facing offset from the member's designed heading, in degrees. Omission
     * holds the prior offset.
     */
    facingOffsetDeg?: number;
  }[];
}
