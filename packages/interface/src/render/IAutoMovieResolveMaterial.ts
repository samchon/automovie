import type { IAutoMovieModel } from "../model/IAutoMovieModel";

/**
 * Cross-model material identity lookup for simulated surfaces and render inventories.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Cross-model material identity lookup for simulated surfaces and render inventories. Nested contracts define the relevant units, ownership and failure states.
 * @evidence contracts/development/design.md#principled-representation The lookup combines borrowed model records and one exact material id, with no encoded-media payload.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Simulated material libraries and render inventory share the same global material resolver input.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Conflicts and absence are refusals, while successful output still aliases its source material.
 */
export namespace IAutoMovieResolveMaterial {
  /**
   * Borrowed admitted models and one exact material id. resolveAutoMovieMaterial scans all matching definitions, sorts candidates by model id and compares recursively key-ordered structural signatures. Identical definitions share one identity; absent or conflicting definitions throw.
   *
   * The returned material is the selected original record, not a copy, and no model/material is changed. Equal model ids retain source tie order, so equivalent result contents do not promise reference identity under every reordering. Full material-shape admission belongs upstream.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines lookup scope, exact id matching, refusal, structural comparison and borrowed output.
   * @evidence contracts/development/design.md#principled-representation A string is a material id within the compiled model population, not image bytes or a model id; runtime rejects blank, absent and conflicting ids.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Simulated-surface material libraries and render inventory use this global lookup while ordinary parts retain model-local binding.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No fallback material masks missing identity and no winning candidate conceals conflicting definitions; existing model/material contracts own the records.
   */
  export type IProps = {
    /** Read-only population whose materials are searched; an empty population makes every lookup absent. Nested records remain borrowed and must already have valid material shapes. */
    models: readonly IAutoMovieModel[];

    /** Exact material id; whitespace-only ids throw, but nonblank ids are matched without trimming or case folding. */
    material: string;
  };
}
