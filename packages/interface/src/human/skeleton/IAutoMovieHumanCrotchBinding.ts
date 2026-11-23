import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/**
 * The point and spatial half-width of a crotch skin-binding release, in metres.
 *
 * The interface package owns these declarations; AutoMovieHumanCrotchBinding in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanCrotchBinding {
  /** Where the release lies. */
  export interface IRelease {
    /** Point where the release is half done, metres. */
    at: AutoMovieVector3Tuple;

    /** Half of the release, metres. */
    half: number;
  }
}
