import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * Type contracts exchanged by AutoMovieHumanHandWebCrest; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanHandWebCrest {
  /** A web's fixed inputs. */
  export interface IInput {
    /** The dorsal crest, left frame, mm. */
    dorsal: AutoMovieVector3Tuple;

    /** The knuckle of the finger whose phalanx the palmar crest reads, mm. */
    mcp: AutoMovieVector3Tuple;

    /** Unit direction along the finger's proximal phalanx. */
    along: AutoMovieVector3Tuple;

    /** Length of that phalanx, mm. */
    phalanx: number;
  }

  /** The two crests. */
  export interface IPair {
    /** The dorsal crest, mm. */
    dorsal: AutoMovieVector3Tuple;

    /** The palmar crest, mm, distal of the dorsal one. */
    palmar: AutoMovieVector3Tuple;
  }
}
