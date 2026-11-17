/** What one instance of a renderer-chosen prototype costs to draw.
 *
 * @evidence contracts/development/design.md#principled-representation Separate exact nonnegative integer vertex and triangle counts for the renderer's actual drawn prototype; count admission belongs to inventory measurement rather than this structural interface.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two quantities capture the geometry facts instanced branch/leaf batching cannot infer from a botanical recipe.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The renderer reports actual tessellation cost; the engine does not substitute a preferred radial segment count or test value.
 * @evidence contracts/development/common.md#meaningful-documentation Both members identify exact per-instance counts and integer/nonnegative premises needed to scale batch metrics.
 */
export interface IAutoMovieRenderPrototypeCost {
  /** Exact vertex count of one instance; a non-negative integer. */
  vertices: number;

  /** Exact triangle count of one instance; a non-negative integer. */
  triangles: number;
}
