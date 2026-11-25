import type { IAutoMovieModel } from "../model/IAutoMovieModel";

/**
 * Cross-model material identity lookup for simulated surfaces and render
 * inventories.
 */
export namespace IAutoMovieResolveMaterial {
  /**
   * Borrowed admitted models and one exact material id.
   * resolveAutoMovieMaterial scans all matching definitions, sorts candidates
   * by model id and compares recursively key-ordered structural signatures.
   * Identical definitions share one identity; absent or conflicting definitions
   * throw.
   *
   * The returned material is the selected original record, not a copy, and no
   * model/material is changed. Equal model ids retain source tie order, so
   * equivalent result contents do not promise reference identity under every
   * reordering. Full material-shape admission belongs upstream.
   */
  export type IProps = {
    /**
     * Read-only population whose materials are searched; an empty population
     * makes every lookup absent. Nested records remain borrowed and must
     * already have valid material shapes.
     */
    models: readonly IAutoMovieModel[];

    /**
     * Exact material id; whitespace-only ids throw, but nonblank ids are
     * matched without trimming or case folding.
     */
    material: string;
  };
}
