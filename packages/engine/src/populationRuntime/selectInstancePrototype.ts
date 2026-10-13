import { IAutoMovieCompiledInstancePrototype } from "@automovie/interface";

import { seededValue } from "../math/seededValue";

/**
 * The prototype one instance slot draws, or the explicit one it names.
 *
 * A set with a prototype table draws from it, and a compiled table already
 * starts with the base recipe's default, counted once. A set without a table
 * draws its base recipe under the id `default`. An explicit member names its
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
 */
export const selectInstancePrototype = <
  Choice extends Pick<
    IAutoMovieCompiledInstancePrototype,
    "id" | "modelRecipe" | "weight"
  >,
>(
  instanceSet: {
    id: string;
    seed: number;
    modelRecipe: string;
    prototypes?: readonly Choice[];
  },
  slot: number,
  explicit: string | undefined,
):
  | Choice
  | Pick<
      IAutoMovieCompiledInstancePrototype,
      "id" | "modelRecipe" | "weight"
    > => {
  const choices: readonly (
    | Choice
    | Pick<IAutoMovieCompiledInstancePrototype, "id" | "modelRecipe" | "weight">
  )[] = instanceSet.prototypes ?? [
    { id: "default", modelRecipe: instanceSet.modelRecipe, weight: 1 },
  ];
  if (explicit !== undefined) {
    const selected = choices.find((choice) => choice.id === explicit);
    if (selected === undefined)
      throw new Error(
        `Instance set "${instanceSet.id}" slot ${slot} references missing prototype "${explicit}".`,
      );
    return selected;
  }
  const total = choices.reduce((sum, choice) => sum + choice.weight, 0);
  let sample = seededValue(instanceSet.seed, slot, 0x70726f74) * total;
  for (const choice of choices.slice(0, -1)) {
    if (sample < choice.weight) return choice;
    sample -= choice.weight;
  }
  return choices.at(-1)!;
};
