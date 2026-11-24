import type { IAutoMovieMotionHumanActionLaw } from "../law/IAutoMovieMotionHumanActionLaw";
import type { IAutoMovieMotionHumanLexiconParams } from "./IAutoMovieMotionHumanLexiconParams";

/**
 * Every canonical lexicon family's laws, by the row's export key: one record a
 * family, naming each of its laws, so a registry reads the laws without probing
 * a namespace's members. A row installed by no family is absent.
 */
export type IAutoMovieMotionHumanLexiconFamilies = {
  readonly [F in keyof IAutoMovieMotionHumanLexiconParams]: Readonly<
    Partial<{
      [K in keyof IAutoMovieMotionHumanLexiconParams[F]]: IAutoMovieMotionHumanActionLaw<
        IAutoMovieMotionHumanLexiconParams[F][K]
      >;
    }>
  >;
};
