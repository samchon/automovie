/**
 * An exact interval intersection for identical sparse coefficient rows.
 * The strongest original endpoints retain their multiplier authority; weaker
 * copies remain in the original admission and final residual population.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Preserves every original affine condition through an equivalent interval intersection.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Records the original endpoint owners needed to restore signed duals and recheck all original rows.
 * @author Samchon
 */
export interface IAutoMovieQuadraticRefinementInterval {
  /** Sorted original variable columns, with exact represented coefficients. */
  indices: number[];

  /** Coefficients paired with indices; proportional rows are not grouped. */
  weights: number[];

  /** Strongest finite lower endpoint, or null for an unbounded side. */
  lower: number | null;

  /** Strongest finite upper endpoint, or null for an unbounded side. */
  upper: number | null;

  /** Original row owning the strongest lower endpoint; -1 means unbounded. */
  lowerOwner: number;

  /** Original row owning the strongest upper endpoint; -1 means unbounded. */
  upperOwner: number;

  /** All original row ordinals, including weaker copies. */
  originals: number[];
}
