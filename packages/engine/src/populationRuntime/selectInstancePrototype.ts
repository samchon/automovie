import { IAutoMovieCompiledInstancePrototype } from "@automovie/interface";

import { seededValue } from "../math/seededValue";
import { instancePrototypeChoices } from "./instancePrototypeChoices";

/**
 * The prototype one instance slot draws, or the explicit one it names.
 *
 * A set with a prototype table draws from it, and a compiled table already
 * starts with the base model's default, counted once. A set without a table
 * draws its base model under the id `default`. An explicit member names its
 * choice outright, and naming one the table lacks refuses. Otherwise the slot's
 * seeded sample, drawn under the prototype salt, is spent across the weights in
 * table order: every choice but the last is tested, and the last is what
 * remains, which is both the weighted answer and the answer when a float
 * residue leaves the sample a hair above the final weight.
 *
 * The instance member regenerator and the structural subject diff both draw
 * through here, so a diff counts a prototype change exactly where a
 * regenerated member changes prototype. The choice returned is the table's own
 * entry, so a caller holding a compiled table reads that entry's tiers.
 *
 * @evidence contracts/common.md#principled-implementation Resolve an explicit prototype id or spend one independently salted seeded sample across positive weights in table order; the final choice receives floating residue. Complete default-first choices and finite representable total weight are upstream premises.
 * @evidence contracts/common.md#clear-and-simple-design One weighted-choice owner serves instance regeneration and subject diff so both identify the same prototype for an addressed slot.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The final-choice residue rule preserves the existing weighted policy, not a fixture fallback; missing explicit ids throw and no actor/model spelling changes probabilities.
 * @evidence contracts/common.md#meaningful-documentation Docs identify explicit-id refusal, seeded salt, default-first convention and borrowed selected table entry including its compiled tiers.
 * @evidence contracts/performance.md#efficient-algorithms P choices require O(P) total/selection scans and constant additional selection state; explicit selection is an O(P) find without copying a choice prefix.
 * @evidence contracts/performance.md#reuse-equivalent-work Regeneration and diff reuse this canonical selection law; the returned entry is borrowed, and changed weights/seed/slot require a new selection.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No choice history or prefix copy is retained; the input table stays caller-owned and only the selected borrowed entry escapes.
 */
export const selectInstancePrototype: <
  Choice extends Pick<
    IAutoMovieCompiledInstancePrototype,
    "id" | "model" | "weight"
  >,
>(
  instanceSet: {
    id: string;
    seed: number;
    model: string;
    prototypes?: readonly Choice[];
  },
  slot: number,
  explicit: string | undefined,
) =>
  | Choice
  | Pick<IAutoMovieCompiledInstancePrototype, "id" | "model" | "weight"> = <
  Choice extends Pick<
    IAutoMovieCompiledInstancePrototype,
    "id" | "model" | "weight"
  >,
>(
  instanceSet: {
    id: string;
    seed: number;
    model: string;
    prototypes?: readonly Choice[];
  },
  slot: number,
  explicit: string | undefined,
):
  | Choice
  | Pick<IAutoMovieCompiledInstancePrototype, "id" | "model" | "weight"> => {
  const choices: readonly (
    | Choice
    | Pick<IAutoMovieCompiledInstancePrototype, "id" | "model" | "weight">
  )[] = instancePrototypeChoices(instanceSet);
  if (explicit !== undefined) {
    const selected:
      | Pick<IAutoMovieCompiledInstancePrototype, "id" | "model" | "weight">
      | Choice
      | undefined = choices.find(
      (
        choice:
          | Pick<IAutoMovieCompiledInstancePrototype, "id" | "model" | "weight">
          | Choice,
      ): boolean => choice.id === explicit,
    );
    if (selected === undefined)
      throw new Error(
        `Instance set "${instanceSet.id}" slot ${slot} references missing prototype "${explicit}".`,
      );
    return selected;
  }
  const total: number = choices.reduce(
    (
      sum: number,
      choice:
        | Pick<IAutoMovieCompiledInstancePrototype, "id" | "model" | "weight">
        | Choice,
    ): number => sum + choice.weight,
    0,
  );
  let sample: number = seededValue(instanceSet.seed, slot, 0x70726f74) * total;
  for (let index: number = 0; index < choices.length - 1; ++index) {
    const choice: (typeof choices)[number] = choices[index]!;
    if (sample < choice.weight) return choice;
    sample -= choice.weight;
  }
  return choices.at(-1)!;
};
