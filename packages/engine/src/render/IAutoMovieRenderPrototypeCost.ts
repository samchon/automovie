/** What one instance of a renderer-chosen prototype costs to draw.
 *
 * @evidence contracts/common.md#principled-implementation Separate exact nonnegative integer vertex and triangle counts for the renderer's actual drawn prototype; count admission belongs to inventory measurement rather than this structural interface.
 * @evidence contracts/common.md#clear-and-simple-design Two quantities capture the geometry facts instanced branch/leaf batching cannot infer from a botanical recipe.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The renderer reports actual tessellation cost; the engine does not substitute a preferred radial segment count or test value.
 * @evidence contracts/common.md#meaningful-documentation Both members identify exact per-instance counts and integer/nonnegative premises needed to scale batch metrics.
 * @evidence contracts/performance.md#efficient-algorithms One prototype cost is fixed-size; multiplying by an admitted batch count is constant arithmetic in the simulation inventory.
 * @evidence contracts/performance.md#reuse-equivalent-work One reported prototype can serve all equivalent instances in its batch; this type does not prove equivalence across differing renderer prototypes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only two scalars are retained and no geometry buffer, native handle or task is owned.
 */
export interface IAutoMovieRenderPrototypeCost {
  /** Exact vertex count of one instance; a non-negative integer. */
  vertices: number;

  /** Exact triangle count of one instance; a non-negative integer. */
  triangles: number;
}
