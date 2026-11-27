import type { IAutoMovieMotionHumanActionLaw } from "@automovie/interface";

import { HUMAN_LEXICON_FAMILIES } from "./HUMAN_LEXICON_FAMILIES";

/**
 * Every row and law of the lexicon by family, as data: what a page, a test and
 * an agent's search read to know which named actions exist beyond the
 * vocabulary. Pass a family's list, or all of them, to a performance's `laws`
 * to register them at once. Each family's laws are the ones its record names
 * (`HUMAN_LEXICON_FAMILIES`), in their declared order.
 */
export const HUMAN_LEXICON: Readonly<
  Record<string, readonly IAutoMovieMotionHumanActionLaw<never>[]>
> = Object.fromEntries(
  Object.entries(HUMAN_LEXICON_FAMILIES).map(
    ([family, laws]: [
      string,
      Readonly<Partial<Record<string, IAutoMovieMotionHumanActionLaw<never>>>>,
    ]): [string, readonly IAutoMovieMotionHumanActionLaw<never>[]] => [
      family,
      Object.values(laws).filter(
        (
          law: IAutoMovieMotionHumanActionLaw<never> | undefined,
        ): law is IAutoMovieMotionHumanActionLaw<never> => law !== undefined,
      ),
    ],
  ),
);
