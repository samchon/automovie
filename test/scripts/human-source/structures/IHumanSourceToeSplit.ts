import type { IAutoMovieHumanBodyToeSplit } from "@automovie/human/body/structures/surface/IAutoMovieHumanBodyToeSplit";

/**
 * The body's toe split and the record of how closely the sampled phalanx
 * weights partition each side's toes weight.
 *
 * @author Samchon
 */
export interface IHumanSourceToeSplit {
  /** The split the body surface declares. */
  split: IAutoMovieHumanBodyToeSplit;

  /** Split record, written to the P1 checks. */
  record: Record<string, unknown>;
}
