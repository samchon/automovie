
/**
 * Current bounded numerical summary for one deterministic effect cue.
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation Records the actual fixed-step sample's active flag/intensity and live count after LOD/cap, with the configured capacity retained separately; counts describe sampler/instance population, not observed fragments or a GPU-budget receipt.
 * @evidence contracts/common.md#clear-and-simple-design One small mutable summary sits beside the emitter mesh so callers inspect current sampling without rebuilding particle lists or reading native buffers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fields follow actual sample values and declared cap, without fixture target counts, native resource replacement or invented render-success flags.
 * @evidence contracts/common.md#meaningful-documentation Gives active sampled step, live-after-LOD population, hard configured cap and cue intensity without presenting them as measured pixels.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This scalar summary shape runs no particle generation, thinning or buffer-write algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The emitter update owns summary mutation; this type coordinates no repeated sampling or renderer work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Four scalar fields own no geometry, material, native instance allocation or task.
 */
export interface IAutoMovieEffectViewerStats {
  /** Whether the cue is active at the sampled fixed step. */
  active: boolean;

  /** Live billboards after LOD and cap enforcement. */
  particles: number;

  /** Configured hard live-particle cap. */
  cap: number;

  /** Sampled cue intensity. */
  intensity: number;
}
