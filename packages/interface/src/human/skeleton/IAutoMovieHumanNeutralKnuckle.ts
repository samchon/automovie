import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/**
 * Type contracts exchanged by AutoMovieHumanNeutralKnuckle; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanNeutralKnuckle {
  /** One finger's skin as the spread reads it. */
  export interface IFinger {
    /** The knuckle, the proximal phalanx's joint, at the bind, mm. */
    knuckle: AutoMovieVector3Tuple;

    /**
     * Depth of each shaft ring's centre from the knuckle, mm, increasing: the
     * rings past the root ring, where the finger's skin leaves the palm's, and
     * before the pulp's two closing rings.
     */
    depths: number[];

    /** Each shaft ring's largest radius about its centre, mm. */
    radii: number[];
  }
}
