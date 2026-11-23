import type { IAutoMovieArcLengthJet } from "../../geometry/IAutoMovieArcLengthJet";

/**
 * Published arclength endpoint jets and arc samples differentiated in their own
 * xi parameter. Runtime construction and admission remain with
 * AutoMovieHumanChordArc in Human.
 */
export namespace IAutoMovieHumanChordArc {
  /**
   * A guide's published jet in the section chart, by arclength:
   * `AutoMovieHumanSeam.publish`.
   */
  export type IEnd = {
    [K in keyof IAutoMovieArcLengthJet]: Readonly<IAutoMovieArcLengthJet[K]>;
  };

  /** A point of the arc with its first and second derivatives in `xi`. */
  export type Jet = [number[], number[], number[]];
}
