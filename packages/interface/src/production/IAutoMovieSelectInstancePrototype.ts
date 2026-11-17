import type { IAutoMovieCompiledInstancePrototype } from "./IAutoMovieCompiledInstancePrototype";
import type { IAutoMovieInstancePrototypeChoices } from "./IAutoMovieInstancePrototypeChoices";


/** Instance-set identity and complete choice table needed for deterministic prototype selection. */
export namespace IAutoMovieSelectInstancePrototype {
  /**
   * Borrowed instance-set fields used to resolve an explicit prototype or draw one for a stable slot address.
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
   * Choice keeps those extra fields in the returned type. The caller must admit a nonempty complete table with positive finite weights and a finite positive total; selection does not validate them or check the slot range. A supplied empty table has no final entry and violates the return contract, whereas an absent table creates the one-entry default. No selection or table cache survives the call.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States explicit-ID refusal, weighted order and seed, full-table convention, empty-table premise and borrowed result ownership.
   * @evidence contracts/development/design.md#principled-representation Stable set and model-group IDs accompany a deterministic seed and complete weighted table. Nonempty/finite-weight and slot-range invariants require upstream population admission.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Regeneration and structural subject comparison share these inputs; Choice preserves compiled tier data on the selected borrowed entry without requiring it on the minimal fallback.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing explicit IDs throw instead of silently drawing another prototype; a final-entry residual policy handles floating-point remainder without content-specific branches.
   */
  export type IInstanceSet<Choice extends Pick<
      IAutoMovieCompiledInstancePrototype,
      "id" | "model" | "weight"
    >> = IAutoMovieInstancePrototypeChoices.IInstanceSet<Choice> & {
      /** Stable set ID used in missing-explicit-prototype errors; it does not enter the weighted random draw. */
      id: string;


      /** Deterministic seed combined with the zero-based slot address and prototype salt. Changing actor names or the set ID does not change that sample. */
      seed: number;
};
}
