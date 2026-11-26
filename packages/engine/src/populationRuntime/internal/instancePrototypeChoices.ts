import {
  IAutoMovieCompiledInstancePrototype,
  type IAutoMovieInstancePrototypeChoices,
} from "@automovie/interface";

/**
 * The prototype table one instance set draws its members from.
 *
 * A set with a prototype table draws from that table, which in a compiled set
 * already starts with the base model's default, counted once. A set without a
 * table draws only its base model, as one choice with the id `default` and
 * weight 1. The returned array is the set's own table when it has one, so the
 * caller must not mutate it.
 *
 * @param instanceSet Set whose table is read.
 * @returns The choices in table order.
 */
export const instancePrototypeChoices = <
  Choice extends Pick<
    IAutoMovieCompiledInstancePrototype,
    "id" | "model" | "weight"
  >,
>(
  instanceSet: IAutoMovieInstancePrototypeChoices.IInstanceSet<Choice>,
): readonly (
  | Choice
  | Pick<IAutoMovieCompiledInstancePrototype, "id" | "model" | "weight">
)[] =>
  instanceSet.prototypes ?? [
    { id: "default", model: instanceSet.model, weight: 1 },
  ];
