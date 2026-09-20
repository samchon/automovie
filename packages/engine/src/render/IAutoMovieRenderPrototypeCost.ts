/**
 * What one instance of a renderer-chosen prototype costs to draw.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Carries the minimal geometry facts needed to multiply a renderer-owned prototype over a compact population.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Keeps supplied prototype cost explicit instead of guessing renderer tessellation.
 */
export interface IAutoMovieRenderPrototypeCost {
  /**
   * Exact vertex count of one instance; a non-negative integer.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Supplies the vertex multiplier for one branch or leaf prototype.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Separates exact prototype vertices from compact instance count.
   */
  vertices: number;

  /**
   * Exact triangle count of one instance; a non-negative integer.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Supplies the triangle multiplier for one branch or leaf prototype.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Separates exact prototype triangles from compact instance count.
   */
  triangles: number;
}
