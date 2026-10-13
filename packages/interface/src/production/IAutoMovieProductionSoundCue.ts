/**
 * One authored timeline cue lowered into the deterministic procedural score.
 */
export interface IAutoMovieProductionSoundCue {
  /** Exact authored cue id. */
  id: string;

  /**
   * The asset this cue plays.
   *
   * Carried because a cue is a statement about a particular sound, and a plan
   * that dropped the name could only ever be rendered as a stand-in for one:
   * the renderer took the id to seed its noise and then had nothing left to
   * play. A caller decodes the asset and hands the samples in, exactly as it
   * already does for synthesized dialogue, so decoding stays outside the
   * deterministic mix and the mix stays a pure function of what it is given.
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
   * This is the asset's identity and the ceiling the trim fits inside, never a
   * selected span or a playback-rate control: the cue reads
   * `durationFrames` frames from `sourceOffsetFrame` at unit rate, and
   * `sourceOffsetFrame + durationFrames` may not exceed this value. Planning
   * verifies it against the decoded asset's own sample count.
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
