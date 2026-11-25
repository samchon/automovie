import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/**
 * Type contracts exchanged by AutoMovieHumanEventJoinRing; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanEventJoinRing {
  /** Dense parent ring at an event and the arc weight of a phase on it. */
  export interface IRing {
    /** The parent's station at the event, mm. */
    sp: number;

    /** The ring's samples at uniform phases, mm. */
    points: AutoMovieVector3Tuple[];

    /** Length along the ring up to each sample, one more entry than the samples. */
    length: number[];

    /**
     * Weight of a phase on the child's arcs, 0 off them and fading to 0 before
     * each pinch.
     */
    weight: (t: number) => number;
  }

  /**
   * The arcs argument of AutoMovieHumanEventJoinRing.parentRing. The parent's
   * ring at an event and the weight of its phases on the child's arcs.
   */
  export type ParentRingArcs = [number, number][];

  /**
   * Result of AutoMovieHumanEventJoinRing.nearest. Nearest point of a dense
   * ring to p: its phase, the point on the closer neighbouring segment, the
   * distance, and the nearest sample's index. A caller walking a ring in order
   * passes the sample it found last as `guess`: its distance bounds the scan
   * from the first step, so the arc length bound passes over almost every
   * sample.
   */
  export type NearestResult = [number, AutoMovieVector3Tuple, number, number];
}
