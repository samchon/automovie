import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import { HUMAN_LEXICON_FAMILIES } from "./HUMAN_LEXICON_FAMILIES";

/** The registered laws a namespace holds: its members that plan. */
const rows = (space: object): readonly IHumanActionLaw<never>[] =>
  Object.values(space).filter(
    (value: unknown): value is IHumanActionLaw<never> =>
      typeof value === "object" && value !== null && "plan" in value,
  );

/**
 * Every row and law of the lexicon by family, as data: what a page, a test
 * and an agent's search read to know which named actions exist beyond the
 * vocabulary. Pass a family's list, or all of them, to a performance's
 * `laws` to register them at once.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the table holds, who reads it and how it registers.
 * @evidence contracts/development/design.md#principled-representation One list of law records per family, derived from the family namespaces of `HUMAN_LEXICON_FAMILIES` so it cannot drift from them.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The table; the families own their rows.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No name is restated: the lists are read from the namespaces.
 */
export const HUMAN_LEXICON: Readonly<
  Record<string, readonly IHumanActionLaw<never>[]>
> = Object.fromEntries(
  Object.entries(HUMAN_LEXICON_FAMILIES).map(
    ([family, spaces]: [string, readonly object[]]): [
      string,
      readonly IHumanActionLaw<never>[],
    ] => [family, spaces.flatMap(rows)],
  ),
);
