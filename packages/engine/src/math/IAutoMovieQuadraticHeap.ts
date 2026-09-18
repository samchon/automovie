/**
 * Borrowed heap access for one synchronous kernel call. Views are refreshed on
 * every access, including after the solver grows its linear memory. The native
 * bridge reports an API error separately from its six solver information values.
 *
 * @author Samchon
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Supplies isolated numeric storage for jointly constrained geometric displacement.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Keeps intermediate constraint storage separate from caller-owned resident mesh buffers.
 */
export interface IAutoMovieQuadraticHeap {
  /** Fresh float64 view of the current linear memory, indexed in doubles. */
  readonly floats: Float64Array;
  /** Fresh int32 view of the current linear memory, indexed in integers. */
  readonly integers: Int32Array;
  /** Invoke the fixed native bridge ABI and return its API error code. */
  solve(...arguments_: number[]): number;
}

type KernelExports = {
  memory: WebAssembly.Memory;
  automovie_alloc(bytes: number): number;
  automovie_free(address: number): void;
  automovie_quadratic_solve(...arguments_: number[]): number;
};
