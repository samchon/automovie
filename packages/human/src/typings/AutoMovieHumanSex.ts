import type { AutoMovieHumanSex as AutoMovieHumanSexContract } from "@automovie/interface";

/**
 * Sex category associated with requested reference statistics.
 *
 * This category distinguishes female and male population statistics. It does not specify detailed body measurements or the continuous masculine/feminine shape coordinate.
 */
export const AutoMovieHumanSex = {
  /** Female population statistics. */
  Female: "female",
  /** Male population statistics. */
  Male: "male",
} as const satisfies Readonly<Record<string, AutoMovieHumanSexContract>>;
