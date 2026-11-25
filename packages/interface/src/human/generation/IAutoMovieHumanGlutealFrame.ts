import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/**
 * Type contracts exchanged by AutoMovieHumanGlutealFrame; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanGlutealFrame {
  /** What the frame reads. */
  export interface IInput {
    /** The buttock point on the wall, `[x, y, z]`, mm. */
    apex: AutoMovieVector3Tuple;

    /**
     * The wall's section tangent at the apex in `[x, z]`, in the direction of
     * rising phase (back: z falling).
     */
    tangent: [number, number];
  }
}
