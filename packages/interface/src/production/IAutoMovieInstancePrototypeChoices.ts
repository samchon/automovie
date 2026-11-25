import type { IAutoMovieCompiledInstancePrototype } from "./IAutoMovieCompiledInstancePrototype";

/** Minimal instance-set view needed to read the complete prototype choice table. */
export namespace IAutoMovieInstancePrototypeChoices {
  /**
   * Borrowed instance-set fields that select an existing complete choice table
   * or an implicit base-model choice.
   *
   * A set with a prototype table draws from that table, which in a compiled set
   * already starts with the base model's default, counted once. A set without a
   * table draws only its base model, as one choice with the id `default` and
   * weight 1. The returned array is the set's own table when it has one, so the
   * caller must not mutate it. A supplied empty array remains empty: only
   * absence creates the fallback. The reader performs no weight, ID or model
   * validation and caches nothing. Choice preserves extra compiled fields on
   * borrowed table entries; the fallback has only id, model and weight.
   */
  export type IInstanceSet<
    Choice extends Pick<
      IAutoMovieCompiledInstancePrototype,
      "id" | "model" | "weight"
    >,
  > = {
    /**
     * Base model-group ID used only when prototypes is absent, creating { id:
     * "default", model, weight: 1 }.
     */
    model: string;

    /**
     * Complete ordered choice table, already including the default where
     * compilation requires it. Returned by reference when present, including
     * []; absence creates a fresh one-choice fallback on each call.
     */
    prototypes?: readonly Choice[];
  };
}
