import type { AutoMovieHumanSex as AutoMovieHumanSexContract } from "@automovie/interface";

/**
 * Sex category associated with requested reference statistics.
 *
 * This category distinguishes female and male population statistics. It does not specify detailed body measurements or the continuous masculine/feminine shape coordinate.
 */
export namespace AutoMovieHumanSex {
  /** Female population statistics. */
  export const Female: "female" = "female" satisfies AutoMovieHumanSexContract;
  /** Male population statistics. */
  export const Male: "male" = "male" satisfies AutoMovieHumanSexContract;
}
