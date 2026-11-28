import type { AutoMovieHumanSex as AutoMovieHumanSexContract } from "@automovie/interface";

/**
 * Sex categories used by Human's parameter and survey inputs.
 *
 * The body anatomy lookup uses the chosen category for sex-dependent defaults.
 * An omitted anatomy sex uses the female table. Traits supply their sex
 * explicitly.
 */
export namespace AutoMovieHumanSex {
  /** Select the female category for survey-dependent measures. */
  export const Female: "female" = "female" satisfies AutoMovieHumanSexContract;
  /** Select the male category for survey-dependent measures. */
  export const Male: "male" = "male" satisfies AutoMovieHumanSexContract;
}
