import type { IAutoMovieMotionHumanActionLaw } from "../law/IAutoMovieMotionHumanActionLaw";
import type { IAutoMovieMotionHumanLexiconParams } from "./IAutoMovieMotionHumanLexiconParams";

/**
 * Runtime namespace collections grouped by the canonical lexicon families. Each
 * namespace contributes some family exports. Lists are borrowed in declared
 * order and never mutated by registry readers.
 */
export type IAutoMovieMotionHumanLexiconFamilies = {
  readonly [F in keyof IAutoMovieMotionHumanLexiconParams]: readonly Partial<{
    [K in keyof IAutoMovieMotionHumanLexiconParams[F]]: IAutoMovieMotionHumanActionLaw<
      IAutoMovieMotionHumanLexiconParams[F][K]
    >;
  }>[];
};
