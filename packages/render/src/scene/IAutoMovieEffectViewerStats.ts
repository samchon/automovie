/** Current bounded numerical summary for one deterministic effect cue. */
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
