/** One authored timeline cue lowered into the deterministic procedural score. */
export interface IAutoMovieProductionSoundCue {
  /** Exact authored cue id. */
  id: string;

  /**
   * Asset whose decoded mono samples the caller supplies at the mix clock. The
   * mixer currently uses a procedural bus stand-in when this buffer is absent,
   * so callers requiring exact asset playback must provide it.
   */
  asset: string;

  /** Film-global inclusive start frame. */
  startFrame: number;

  /** Exact cue duration in film frames. */
  durationFrames: number;

  /** Source-asset frame at which this edit begins. */
  sourceOffsetFrame: number;

  /**
   * Complete source-asset duration on the production frame clock.
   *
   * This is the declared ceiling the trim fits inside, never a selected span or
   * a playback-rate control: the cue reads `durationFrames` frames from
   * `sourceOffsetFrame` at unit rate, and `sourceOffsetFrame + durationFrames`
   * may not exceed this value. The planner copies this declaration without
   * decoding assets; callers own agreement with the asset's actual duration.
   */
  sourceDurationFrames: number;

  /** Authored linear gain. */
  gain: number;

  /** Exact fade-in duration in film frames. */
  fadeInFrames: number;

  /** Exact fade-out duration in film frames. */
  fadeOutFrames: number;

  /** Compiler-owned mix bus. */
  bus: "dialogue" | "music" | "effects" | "ambience";

  /** Stable unsigned 32-bit procedural seed. */
  seed: number;
}
