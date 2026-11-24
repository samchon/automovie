import type { IAutoMovieMotionHumanActionLaw } from "@automovie/interface";

import { HUMAN_LEXICON_FAMILIES } from "./HUMAN_LEXICON_FAMILIES";

/** The registered laws a namespace holds: its members that plan. */
const rows = (
  space: object,
): readonly IAutoMovieMotionHumanActionLaw<never>[] =>
  Object.values(space).filter(
    (value: unknown): value is IAutoMovieMotionHumanActionLaw<never> =>
      typeof value === "object" && value !== null && "plan" in value,
  );

/**
 * Every row and law of the lexicon by family, as data: what a page, a test and
 * an agent's search read to know which named actions exist beyond the
 * vocabulary. Pass a family's list, or all of them, to a performance's `laws`
 * to register them at once.
 */
export const HUMAN_LEXICON: Readonly<
  Record<string, readonly IAutoMovieMotionHumanActionLaw<never>[]>
> = Object.fromEntries(
  Object.entries(HUMAN_LEXICON_FAMILIES).map(
    ([family, spaces]: [string, readonly object[]]): [
      string,
      readonly IAutoMovieMotionHumanActionLaw<never>[],
    ] => [family, spaces.flatMap(rows)],
  ),
);
