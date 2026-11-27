import {
  IAutoMovieCompiledInstancePrototype,
  type IAutoMovieSelectInstancePrototype,
} from "@automovie/interface";

import { seededValue } from "../../math/internal/seededValue";
import { instancePrototypeChoices } from "./instancePrototypeChoices";

/*
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
 * through here, so a diff counts a prototype change exactly where a regenerated
 * member changes prototype. The choice returned is the table's own entry, so a
 * caller holding a compiled table reads that entry's tiers. An explicitly empty
 * table throws; only an absent table creates the default.
 */
export function selectInstancePrototype<
  Choice extends Pick<
    IAutoMovieCompiledInstancePrototype,
    "id" | "model" | "weight"
  >,
>(
  instanceSet: IAutoMovieSelectInstancePrototype.IInstanceSet<Choice>,
  slot: number,
  explicit: string | undefined,
):
  | Choice
  | Pick<IAutoMovieCompiledInstancePrototype, "id" | "model" | "weight"> {
  const choices: readonly (
    | Choice
    | Pick<IAutoMovieCompiledInstancePrototype, "id" | "model" | "weight">
  )[] = instancePrototypeChoices(instanceSet);
  if (choices.length === 0)
    throw new Error(
      `Instance set "${instanceSet.id}" has no prototype choices.`,
    );
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
}
