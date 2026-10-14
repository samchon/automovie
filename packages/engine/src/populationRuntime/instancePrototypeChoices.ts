import { IAutoMovieCompiledInstancePrototype } from "@automovie/interface";

/**
 * The prototype table one instance set draws its members from.
 *
 * A set with a prototype table draws from that table, which in a compiled set
 * already starts with the base recipe's default, counted once. A set without a
 * table draws only its base recipe, as one choice with the id `default` and
 * weight 1. The returned array is the set's own table when it has one, so the
 * caller must not mutate it.
 *
 * @param instanceSet Set whose table is read.
 * @returns The choices in table order.
 *
 * @evidence contracts/common.md#principled-implementation Encodes the one rule for which prototypes a set can draw, the stated table or the single base-recipe default, so membership and weighted selection read the same list.
 * @evidence contracts/common.md#clear-and-simple-design Shared by `selectInstancePrototype`, which draws from the list, and the structural subject diff, which asks whether an explicit member's prototype is in it instead of matching the selection's error message.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No set or prototype is special-cased; the `default` choice is the contract's spelling of a set without a table.
 * @evidence contracts/common.md#meaningful-documentation The documentation states both cases, the default choice's id and weight, the order, and that a stated table is returned by reference.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Constant time: it returns the stated table or one literal choice, with no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure read of one set that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates at most the one-choice default list and retains nothing.
 */
export const instancePrototypeChoices = <
  Choice extends Pick<
    IAutoMovieCompiledInstancePrototype,
    "id" | "modelRecipe" | "weight"
  >,
>(instanceSet: {
  modelRecipe: string;
  prototypes?: readonly Choice[];
}): readonly (
  | Choice
  | Pick<IAutoMovieCompiledInstancePrototype, "id" | "modelRecipe" | "weight">
)[] =>
  instanceSet.prototypes ?? [
    { id: "default", modelRecipe: instanceSet.modelRecipe, weight: 1 },
  ];
