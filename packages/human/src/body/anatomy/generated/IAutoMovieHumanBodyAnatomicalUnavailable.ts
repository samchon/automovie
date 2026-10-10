import type { AutoMovieHumanBodyAnatomicalUnavailableReason } from "./AutoMovieHumanBodyAnatomicalUnavailableReason";

/**
 * A named anatomical component that was not generated, with its cause.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyAnatomicalUnavailable<Id extends string> {
  /** Names the exact part that could not be resolved. */
  readonly id: Id;
  /** No validated individual component was generated. */
  readonly status: "unavailable";
  /** Distinguishes missing input, missing anatomy and domain failure. */
  readonly reason: AutoMovieHumanBodyAnatomicalUnavailableReason;
}
