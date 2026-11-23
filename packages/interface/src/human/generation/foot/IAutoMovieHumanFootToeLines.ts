import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/**
 * Metatarsal-head and toe-apex points in the left calibration frame.
 *
 * The interface package owns these declarations; AutoMovieHumanFootToeLines in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanFootToeLines {
  /** A toe's line. */
  export interface ILine {
    /** Metatarsal head centre, left frame. */
    head: AutoMovieVector3Tuple;

    /** The apex, left frame. */
    tip: AutoMovieVector3Tuple;
  }
}
