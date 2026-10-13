/**
 * One authored timeline cue lowered into the deterministic procedural score.
 *
 * @evidence contracts/common.md#principled-implementation The normalized cue maps a unit-rate source trim and fade spans onto the film frame clock, retaining exact asset identity, gain and bus; the host validates decoded source duration and the mixer reads finite samples within the admitted trim.
 * @evidence contracts/common.md#clear-and-simple-design Keeps reusable source extent distinct from selected duration and source offset; decoded PCM remains a caller-supplied input rather than a codec or filesystem responsibility inside deterministic mixing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing decoded assets currently use the documented procedural bus stand-in, so this plan alone does not prove adopted-asset playback; source-overflow, invalid spans and non-finite supplied samples refuse.
 * @evidence contracts/common.md#meaningful-documentation Defines exact asset and cue identity, global frame placement, unit-rate trim ceiling, fades, gain, bus and procedural seed, including the missing-buffer stand-in limitation.
 * @author Samchon
 */
export interface IAutoMovieProductionSoundCue {
  /** Exact authored cue id. */
  id: string;

  /**
   * Asset whose decoded mono samples the caller supplies at the mix clock. The mixer currently uses a procedural bus stand-in when this buffer is absent, so callers requiring exact asset playback must provide it.
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
   * This is the asset's identity and the ceiling the trim fits inside, never a selected span or a playback-rate control: the cue reads `durationFrames` frames from `sourceOffsetFrame` at unit rate, and `sourceOffsetFrame + durationFrames` may not exceed this value. Planning verifies it against the decoded asset's own sample count.
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
