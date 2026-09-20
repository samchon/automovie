import { IAutoMovieWorldSurface } from "@automovie/interface";

/**
 * The terrain a formation's members are placed on.
 *
 * Carried on the record rather than passed beside it, because a member's height
 * is part of where that member stands: a consumer that could ask for a position
 * without the ground would be a consumer that places a crowd flat, which is the
 * defect this exists to remove. The compiled formation snapshots exactly these
 * surfaces, so the builder, the gate, the viewer and an offline measurement
 * script all place from one record and cannot answer differently.
 *
 * @evidence requirements/formations/budgets-and-validation.md#formation-layout-validation Retains the authoritative ground snapshot used to check every slot's placement and bounds.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-geometry-layout-motion-validation Gives builder, renderer, and validation one shared terrain input for formation layout.
 */
export interface IAutoMovieFormationGrounding {
  /**
   * World terrain under this formation, or absent when it stands on none.
   *
   * A snapshot of the production world's surfaces, kept beside the formation
   * the way a compiled instance set keeps the route it follows. Absent or empty
   * means no terrain was declared under the unit, and every member then stands
   * at the anchor's own height, which is what a formation did before ground was
   * sampled at all.
   *
   * @evidence requirements/formations/budgets-and-validation.md#formation-layout-validation Supplies the exact surfaces against which slot ground placement is evaluated.
   * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-geometry-layout-motion-validation Distinguishes a declared terrain snapshot from the intentional no-terrain placement case.
   */
  readonly ground?: readonly IAutoMovieWorldSurface[];
}
