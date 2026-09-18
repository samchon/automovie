import type { IAutoMovieProductionSoundPlan } from "@automovie/interface";
import { applyAutoMovieInteriorAcousticResponse } from "./applyAutoMovieInteriorAcousticResponse";
import { IAutoMovieRenderedProductionSound } from "./IAutoMovieRenderedProductionSound";

/**
 * Render the event palette, procedural score, and already synthesized dialogue
 * into exact-runtime PCM. Dialogue buffers are mono and keyed by line id.
 *
 * Propagation and room responses are optional event receipts. Their absence
 * preserves the pre-existing mix byte for byte; an unavailable response is not
 * treated as dry success.
 *
 * @evidence requirements/sound/spatialization-and-propagation.md#sound-direct-path Consumes declared arrival, broadband gain, and spectral loss when supplied.
 * @evidence specifications/simulation-effects-and-sound/ambience-music-spatial-and-acoustics.md#spatial-direct-path-and-output-mapping Maps a supported propagation receipt into PCM.
 * @evidence requirements/sound/interior-acoustics.md#sound-acoustic-mix-consumption Applies the analysis-backed response selected for each event.
 * @evidence requirements/sound/interior-acoustics.md#sound-acoustic-claim-boundary Treats the shared broadband response as a bounded proxy and refuses unavailable outcomes.
 * @evidence requirements/sound/interior-acoustics.md#sound-bounded-room-response Applies the bounded room-response tier before adding the event to master PCM.
 * @evidence specifications/simulation-effects-and-sound/ambience-music-spatial-and-acoustics.md#bounded-acoustic-response-and-provider-adoption Consumes the selected bounded response without inventing acoustic facts.
 * @evidence specifications/simulation-effects-and-sound/ambience-music-spatial-and-acoustics.md#acoustic-mix-consumption-and-claim-boundary Keeps missing or unsupported response distinct from success.
 * @evidence specifications/simulation-effects-and-sound/ambience-music-spatial-and-acoustics.md#spatial-extended-group-source-aggregation Computes source centroid, spread, member count, and density gain before mixing.
 * @evidence requirements/sound/spatialization-and-propagation.md#sound-extended-group-sources Computes effective source mass, centroid, spread, and density gain from resolved members.
 * @evidence requirements/sound/spatialization-and-propagation.md#sound-listener-identity Resolves the shot camera as the exact event listener.
 * @evidence requirements/sound/spatialization-and-propagation.md#sound-spatial-output-mapping Computes listener-local pan and maps event gain into stereo PCM.
 * @evidence requirements/sound/spatialization-and-propagation.md#sound-propagation-refusal Invokes the declared propagation profile and propagates its refusal.
 * @evidence specifications/simulation-effects-and-sound/ambience-music-spatial-and-acoustics.md#spatial-occlusion-and-propagation-failure Preserves propagation refusal rather than substituting an estimated path.
 * @evidence requirements/sound/validation-and-delivery.md#sound-numeric-verification Computes exact runtime, sample-frame, channel, peak, clipping, silence, and synchronization facts from final PCM.
 * @evidence specifications/simulation-effects-and-sound/validation-evidence-and-compatibility.md#sound-budget-and-audible-review Computes exact numeric verification facts from final mixed PCM.
 * @evidence requirements/sound/scope-and-identity.md#sound-fixed-audio-clock Converts every film-frame boundary directly through the plan FPS and declared sample rate without a mutable sample cursor.
 * @evidence requirements/sound/mix-hierarchy-and-loudness.md#sound-loudness-peak Measures integrated loudness, sample peak, and clipping state from the exact post-limiter master samples.
 * @evidence requirements/sound/editing-synchronization-and-continuity.md#sound-time-transform Reads each cue's source trim at unit rate from exact rational frame boundaries, so the sample index is derived from the frame clock rather than identified with it.
 * @evidence requirements/sound/editing-synchronization-and-continuity.md#sound-audiovisual-duration-join Derives the final PCM length once from total picture frames, FPS, and sample rate.
 * @evidence requirements/sound/event-cues-and-timing.md#sound-cue-sample-boundary Maps every cue's start, source trim, end, and fade boundary onto the sample clock through the one nearest-tick rule.
 * @evidence requirements/sound/event-cues-and-timing.md#sound-cue-refusal Refuses a cue whose trim leaves its declared source duration or whose span is empty before any sample is mixed.
 * @evidence specifications/simulation-effects-and-sound/clocks-ordering-seek-and-checkpoints.md#effect-film-time-step-boundary Maps film-frame positions directly onto the separate fixed audio sample clock.
 * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-cue-sample-boundary-and-arrival Converts each cue's presentation and source film-time boundaries to integer sample indices exactly once.
 * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#sound-cue-failure-contract Fails a cue with an empty span or a trim outside its declared source instead of mixing a plausible result.
 * @evidence specifications/simulation-effects-and-sound/mix-stems-loudness-and-av-join.md#sound-processing-chain-and-stable-summation Executes event, cue, dialogue, and master-limiter stages in one deterministic plan order.
 * @evidence specifications/simulation-effects-and-sound/mix-stems-loudness-and-av-join.md#sound-mix-automation-sample-clock Evaluates cue gain and fades from the current sample index rather than prior playback state.
 * @evidence specifications/simulation-effects-and-sound/mix-stems-loudness-and-av-join.md#sound-loudness-peak-and-mix-failure Computes loudness and peak facts only after the declared master limiting stage.
 * @evidence specifications/simulation-effects-and-sound/mix-stems-loudness-and-av-join.md#sound-event-sync-and-boundary-continuity Places each cue's source trim on its film presentation span without altering the source clock.
 * @evidence specifications/simulation-effects-and-sound/mix-stems-loudness-and-av-join.md#audio-visual-duration-and-timebase-join Produces one audio sample range from the finished picture range and shared timebase.
 */
export const renderProductionSound = (props: {
  /** Sound plan being rendered. */
  plan: IAutoMovieProductionSoundPlan;
  /** Synthesized mono dialogue keyed by line id. */
  dialogue?: ReadonlyMap<string, Float32Array>;
  /**
   * Decoded mono samples for the assets the plan's cues name, at the plan's own
   * sample rate, keyed by asset id.
   *
   * Supplied rather than read, for the reason dialogue already is: decoding a
   * container is I/O and a codec, and neither belongs inside a mix that has to
   * produce the same bytes on every machine. A cue whose asset is absent falls
   * back to the bus stand-in, so a film mixes at every stage of its authoring
   * and a missing asset is silence-shaped rather than a crash.
   *
   * A supplied generation is the asset's audio laid on the plan's sample clock
   * from its first sample; its declared extent is the cue's complete
   * `sourceDurationFrames`. Whether the generation is that asset is settled
   * where the source clock is known, by digest and sample count at planning,
   * because a resampled generation ends within one sample of the declared
   * frame boundary and the mix clock alone cannot tell that from a wrong one.
   * The mix owns what it can decide exactly: every sample is finite, every
   * read stays inside the cue's trim and the generation, and a tick the
   * generation does not reach is silent.
   */
  assets?: ReadonlyMap<string, Float32Array>;
}): IAutoMovieRenderedProductionSound => {
  // Every cue is placed on the sample clock before any sample is mixed, so a
  // cue that contradicts its own source is refused before the work it would
  // have wasted, and each placement is computed once for the mix that follows.
  const ranges = props.plan.cues.map((cue) => cueSampleRanges(props.plan, cue));
  for (const asset of new Set(props.plan.cues.map((cue) => cue.asset))) {
    const source = props.assets?.get(asset);
    if (source !== undefined)
      assertFiniteProductionPcm(source, `audio asset "${asset}"`);
  }
  for (const line of new Set(props.plan.dialogue.map((line) => line.id))) {
    const source = props.dialogue?.get(line);
    if (source !== undefined)
      assertFiniteProductionPcm(source, `dialogue line "${line}"`);
  }
  const sampleFrames = frameToSample(props.plan, props.plan.totalFrames);
  const pcm = new Float32Array(sampleFrames * 2);
  for (const event of props.plan.events) {
    const room = event.acousticResponse;
    if (room === undefined) mixEvent(pcm, props.plan, event);
    else {
      const dry = new Float32Array(pcm.length);
      mixEvent(dry, props.plan, event);
      const responded = applyAutoMovieInteriorAcousticResponse({
        samples: dry,
        channels: props.plan.channels,
        sampleRate: props.plan.sampleRate,
        response: room,
      });
      for (let index = 0; index < pcm.length; ++index)
        pcm[index] += responded[index]!;
    }
  }
  props.plan.cues.forEach((cue, index) =>
    mixCue(pcm, props.plan, cue, ranges[index]!, props.assets?.get(cue.asset)),
  );
  for (const line of props.plan.dialogue) {
    const source = props.dialogue?.get(line.id);
    if (source === undefined) continue;
    const start = frameToSample(props.plan, line.startFrame);
    const end = frameToSample(props.plan, line.endFrame);
    const fitted = resampleMono(source, Math.max(0, end - start));
    for (
      let index = 0;
      index < fitted.length && start + index < sampleFrames;
      ++index
    ) {
      const envelope = edgeEnvelope(index, fitted.length, 240);
      const value = fitted[index]! * envelope * 0.72;
      pcm[(start + index) * 2] += value;
      pcm[(start + index) * 2 + 1] += value;
    }
  }
  assertFiniteProductionPcm(pcm, "generated production mix");
  let peak = 0;
  for (const value of pcm) peak = Math.max(peak, Math.abs(value));
  if (peak > 0.95) {
    const scale = 0.95 / peak;
    for (let index = 0; index < pcm.length; ++index)
      pcm[index] = Math.fround(pcm[index]! * scale);
  }
  return { pcm, analysis: analyzeProductionSound(props.plan, pcm) };
};

/** Refuse an adopted PCM generation before interpolation or numeric evidence. */
const assertFiniteProductionPcm = (
  samples: Float32Array,
  source: string,
): void => {
  if (samples.length === 0)
    throw new Error(`Production sound ${source} supplied empty PCM.`);
  for (let index = 0; index < samples.length; ++index)
    if (Number.isFinite(samples[index]) === false)
      throw new Error(
        `Production sound ${source} contains a non-finite PCM sample at index ${index}.`,
      );
};

/** Refuse an adopted PCM generation before interpolation or numeric evidence. */
const assertFiniteProductionPcm = (
  samples: Float32Array,
  source: string,
): void => {
  if (samples.length === 0)
    throw new Error(`Production sound ${source} supplied empty PCM.`);
  for (let index = 0; index < samples.length; ++index)
    if (Number.isFinite(samples[index]) === false)
      throw new Error(
        `Production sound ${source} contains a non-finite PCM sample at index ${index}.`,
      );
};
