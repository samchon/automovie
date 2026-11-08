/**
 * Current bounded numerical summary for one deterministic effect cue.
 *
 * @evidence contracts/development/design.md#principled-representation Records the actual fixed-step sample's active flag/intensity and live count after LOD/cap, with the configured capacity retained separately; counts describe sampler/instance population, not observed fragments or a GPU-budget receipt.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One small mutable summary sits beside the emitter mesh so callers inspect current sampling without rebuilding particle lists or reading native buffers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Fields follow actual sample values and declared cap, without fixture target counts, native resource replacement or invented render-success flags.
 * @evidence contracts/development/common.md#meaningful-documentation Gives active sampled step, live-after-LOD population, hard configured cap and cue intensity without presenting them as measured pixels.
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
