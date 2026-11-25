import type { IAutoMovieCompiledInstancePrototype } from "./IAutoMovieCompiledInstancePrototype";
import type { IAutoMovieInstancePrototypeChoices } from "./IAutoMovieInstancePrototypeChoices";

/**
 * Instance-set identity and complete choice table needed for deterministic
 * prototype selection.
 */
export namespace IAutoMovieSelectInstancePrototype {
  /**
   * Borrowed instance-set fields used to resolve an explicit prototype or draw
   * one for a stable slot address.
   *
   * A set with a prototype table draws from it, and a compiled table already
   * starts with the base model's default, counted once. A set without a table
   * draws its base model under the id `default`. An explicit member names its
   * choice outright, and naming one the table lacks refuses. Otherwise the
   * slot's seeded sample, drawn under the prototype salt, is spent across the
   * weights in table order: every choice but the last is tested, and the last
   * is what remains, which is both the weighted answer and the answer when a
   * float residue leaves the sample a hair above the final weight.
   *
   * The instance member regenerator and the structural subject diff both draw
   * through here, so a diff counts a prototype change exactly where a
   * regenerated member changes prototype. The choice returned is the table's
   * own entry, so a caller holding a compiled table reads that entry's tiers.
   * Choice keeps those extra fields in the returned type. Selection rejects an
   * explicitly empty table. The caller admits positive finite weights, a finite
   * positive total and valid slot addresses; selection does not check those
   * remaining premises. An absent table creates the one-entry default. No
   * selection or table cache survives the call.
   */
  export type IInstanceSet<
    Choice extends Pick<
      IAutoMovieCompiledInstancePrototype,
      "id" | "model" | "weight"
    >,
  > = IAutoMovieInstancePrototypeChoices.IInstanceSet<Choice> & {
    /**
     * Stable set ID used in missing-explicit-prototype errors; it does not
     * enter the weighted random draw.
     */
    id: string;

    /**
     * Deterministic seed combined with the zero-based slot address and
     * prototype salt. Changing actor names or the set ID does not change that
     * sample.
     */
    seed: number;
  };
}
