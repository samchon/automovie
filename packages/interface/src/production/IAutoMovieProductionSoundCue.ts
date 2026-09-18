/**
 * One authored timeline cue lowered into the deterministic procedural score.
 *
 * @evidence requirements/sound/event-cues-and-timing.md#sound-cue-sample-boundary Exposes `IAutoMovieProductionSoundCue` as the portable data boundary for the sound cue sample boundary requirement.
 * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-cue-sample-boundary-and-arrival Types `IAutoMovieProductionSoundCue` for the sound cue sample boundary and arrival system contract.
 */
export interface IAutoMovieProductionSoundCue {
  /**
   * Exact authored cue id.
   *
   * @evidence requirements/sound/event-cues-and-timing.md#sound-cue-sample-boundary Exposes `id` as the portable data boundary for the sound cue sample boundary requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-cue-sample-boundary-and-arrival Types `id` for the sound cue sample boundary and arrival system contract.
   */
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
   *
   * @evidence requirements/sound/event-cues-and-timing.md#sound-cue-sample-boundary Exposes `asset` as the portable data boundary for the sound cue sample boundary requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-cue-sample-boundary-and-arrival Types `asset` for the sound cue sample boundary and arrival system contract.
   */
  asset: string;
  /**
   * Film-global inclusive start frame.
   *
   * @evidence requirements/sound/event-cues-and-timing.md#sound-cue-sample-boundary Exposes `startFrame` as the portable data boundary for the sound cue sample boundary requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-cue-sample-boundary-and-arrival Types `startFrame` for the sound cue sample boundary and arrival system contract.
   */
  startFrame: number;
  /**
   * Exact cue duration in film frames.
   *
   * @evidence requirements/sound/event-cues-and-timing.md#sound-cue-sample-boundary Exposes `durationFrames` as the portable data boundary for the sound cue sample boundary requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-cue-sample-boundary-and-arrival Types `durationFrames` for the sound cue sample boundary and arrival system contract.
   */
  durationFrames: number;
  /**
   * Source-asset frame at which this edit begins.
   *
   * @evidence requirements/sound/event-cues-and-timing.md#sound-cue-sample-boundary Exposes `sourceOffsetFrame` as the portable data boundary for the sound cue sample boundary requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-cue-sample-boundary-and-arrival Types `sourceOffsetFrame` for the sound cue sample boundary and arrival system contract.
   */
  sourceOffsetFrame: number;
  /**
   * Complete source-asset duration on the production frame clock.
   *
   * This is the asset's identity and the ceiling the trim fits inside, never a
   * selected span or a playback-rate control: the cue reads
   * `durationFrames` frames from `sourceOffsetFrame` at unit rate, and
   * `sourceOffsetFrame + durationFrames` may not exceed this value. Planning
   * verifies it against the decoded asset's own sample count.
   *
   * @evidence requirements/sound/event-cues-and-timing.md#sound-cue-sample-boundary Exposes `sourceDurationFrames` as the portable data boundary for the sound cue sample boundary requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-cue-sample-boundary-and-arrival Types `sourceDurationFrames` for the sound cue sample boundary and arrival system contract.
   */
  sourceDurationFrames: number;
  /**
   * Authored linear gain.
   *
   * @evidence requirements/sound/event-cues-and-timing.md#sound-cue-sample-boundary Exposes `gain` as the portable data boundary for the sound cue sample boundary requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-cue-sample-boundary-and-arrival Types `gain` for the sound cue sample boundary and arrival system contract.
   */
  gain: number;
  /**
   * Exact fade-in duration in film frames.
   *
   * @evidence requirements/sound/event-cues-and-timing.md#sound-cue-sample-boundary Exposes `fadeInFrames` as the portable data boundary for the sound cue sample boundary requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-cue-sample-boundary-and-arrival Types `fadeInFrames` for the sound cue sample boundary and arrival system contract.
   */
  fadeInFrames: number;
  /**
   * Exact fade-out duration in film frames.
   *
   * @evidence requirements/sound/event-cues-and-timing.md#sound-cue-sample-boundary Exposes `fadeOutFrames` as the portable data boundary for the sound cue sample boundary requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-cue-sample-boundary-and-arrival Types `fadeOutFrames` for the sound cue sample boundary and arrival system contract.
   */
  fadeOutFrames: number;
  /**
   * Compiler-owned mix bus.
   *
   * @evidence requirements/sound/event-cues-and-timing.md#sound-cue-sample-boundary Exposes `bus` as the portable data boundary for the sound cue sample boundary requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-cue-sample-boundary-and-arrival Types `bus` for the sound cue sample boundary and arrival system contract.
   */
  bus: "dialogue" | "music" | "effects" | "ambience";
  /**
   * Stable unsigned 32-bit procedural seed.
   *
   * @evidence requirements/sound/event-cues-and-timing.md#sound-cue-sample-boundary Exposes `seed` as the portable data boundary for the sound cue sample boundary requirement.
   * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-cue-sample-boundary-and-arrival Types `seed` for the sound cue sample boundary and arrival system contract.
   */
  seed: number;
}
