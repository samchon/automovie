import type { IAutoMovieMotionHumanActionLaw } from "../law/IAutoMovieMotionHumanActionLaw";
import type { IAutoMovieMotionHumanLexiconParams } from "./IAutoMovieMotionHumanLexiconParams";

/**
 * Runtime namespace collections grouped by the canonical lexicon families.
 * Each namespace contributes some family exports.
 * Lists are borrowed in declared order and never mutated by registry readers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States partial namespace coverage and ownership.
 * @evidence contracts/development/design.md#principled-representation Every family and row key comes from the canonical parameter map; each present law plans exactly those open parameters.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The runtime registry uses this family-to-namespace shape.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contract supplies the runtime table's types without deriving a map from that table.
 */
export type IAutoMovieMotionHumanLexiconFamilies = {
  readonly [F in keyof IAutoMovieMotionHumanLexiconParams]: readonly Partial<{
    [K in keyof IAutoMovieMotionHumanLexiconParams[F]]: IAutoMovieMotionHumanActionLaw<
      IAutoMovieMotionHumanLexiconParams[F][K]
    >;
  }>[];
};
