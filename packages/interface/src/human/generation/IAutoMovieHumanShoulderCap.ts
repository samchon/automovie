/**
 * The outer upper-arm edge at glenohumeral height, with its girth-derived
 * radius.
 *
 * The interface package owns these declarations; AutoMovieHumanShoulderCap in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanShoulderCap {
  /** The arm's outer edge at the glenohumeral centre's height. */
  export interface IEdge {
    /** Height of the glenohumeral centre, mm. */
    y: number;

    /** Lateral place of the glenohumeral centre, mm. */
    z: number;

    /** The upper arm's girth radius, mm: the biceps tape over 2 pi. */
    radius: number;
  }
}
