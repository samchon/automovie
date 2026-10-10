import type { AutoMovieHumanBodyExteriorGapReason } from "./AutoMovieHumanBodyExteriorGapReason";

/**
 * A surface target of the numerical body request that the exterior cannot
 * answer yet, with the dependency it lacks.
 *
 * A path appears either here or in `HUMAN_BODY_EXTERIOR_TARGETS`, never in
 * both: a gap is not approximated by another instrument, and the editor lists
 * it disabled with its detail.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyExteriorGap {
  /** Document path below `anatomy`, such as `surface.leftUpperLimb.hand.length`. */
  readonly path: string;

  /** The kind of dependency the path lacks. */
  readonly reason: AutoMovieHumanBodyExteriorGapReason;

  /** One sentence naming the missing landmark, rule or tissue. */
  readonly detail: string;
}
