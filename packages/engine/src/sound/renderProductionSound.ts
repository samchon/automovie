import type { IAutoMovieProductionSoundAnalysis, IAutoMovieProductionSoundPlan } from "@automovie/interface";
import { productionFrameBoundaryToGridTick } from "../film/productionFrameBoundaryToGridTick";
import { productionFrameIntervalToGridTicks } from "../film/productionFrameIntervalToGridTicks";
import { resolveProductionFrameRate } from "../film/resolveProductionFrameRate";
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

const mixEvent = (
  pcm: Float32Array,
  plan: IAutoMovieProductionSoundPlan,
  event: IAutoMovieProductionSoundPlan["events"][number],
): void => {
  const durationSeconds: Record<typeof event.kind, number> = {
    contact: 0.22,
    arrival: 0.7,
    break: 0.48,
    reveal: 1.1,
    transition: 0.55,
  };
  const propagation = event.propagation;
  if (propagation?.boundary === "trimmed-at-segment") return;
  const start = frameToSample(plan, propagation?.arrivalFrame ?? event.frame);
  const length = Math.round(durationSeconds[event.kind] * plan.sampleRate);
  const left = Math.sqrt((1 - event.pan) * 0.5);
  const right = Math.sqrt((1 + event.pan) * 0.5);
  const spectralGain = propagation?.highFrequencyGain ?? 1;
  let filtered = 0;
  for (
    let index = 0;
    index < length && start + index < pcm.length / 2;
    ++index
  ) {
    const t = index / plan.sampleRate;
    const normalized = index / Math.max(1, length - 1);
    const envelope = Math.exp(-5 * normalized);
    const noise = seededNoise(event.seed, index);
    const base: Record<typeof event.kind, number> = {
      contact: Math.sin(2 * Math.PI * 115 * t) + noise * 0.45,
      arrival: Math.sin(2 * Math.PI * (58 + 42 * normalized) * t),
      break: noise * 0.9 + Math.sin(2 * Math.PI * 190 * t) * 0.3,
      reveal:
        Math.sin(2 * Math.PI * (220 + 440 * normalized) * t) * 0.7 +
        Math.sin(2 * Math.PI * 330 * t) * 0.3,
      transition: noise * 0.25 + Math.sin(2 * Math.PI * 88 * t) * 0.5,
    };
    const impulse = index === 0 ? 1 : 0;
    const dry = base[event.kind] * envelope * 0.28 + impulse * 0.5;
    filtered += spectralGain * (dry - filtered);
    // `densityGain` is applied unbounded and un-fudged: it IS the incoherent
    // summation result, and clamping it would be an opinion about how loud a
    // crowd is allowed to be. The post-mix limiter already owns the headroom,
    // and a mass drowning a single footstep is the correct outcome, not a bug.
    const value =
      filtered *
      (propagation?.distanceGain ?? event.attenuation) *
      event.densityGain;
    pcm[(start + index) * 2] += value * left;
    pcm[(start + index) * 2 + 1] += value * right;
  }
};

const mixCue = (
  pcm: Float32Array,
  plan: IAutoMovieProductionSoundPlan,
  cue: IAutoMovieProductionSoundPlan["cues"][number],
  range: ICueSampleRanges,
  source: Float32Array | undefined,
): void => {
  if (cue.gain === 0) return;
  const start = range.presentation.start;
  const length = range.presentation.end - start;
  const fadeIn = frameToSample(plan, cue.fadeInFrames);
  const fadeOut = frameToSample(plan, cue.fadeOutFrames);
  // Everything constant across the cue, read once. A film-length cue runs this
  // loop tens of millions of times, so a value derived inside it is derived per
  // sample: at half an hour that is the difference between a mix that costs its
  // buffer and one that costs several.
  const played = source !== undefined;
  for (let index = 0; index < length; ++index) {
    const fade =
      Math.min(1, fadeIn === 0 ? 1 : index / fadeIn) *
      Math.min(1, fadeOut === 0 ? 1 : (length - index) / fadeOut);
    // The trim is read at unit rate from its own start tick. Its source and
    // presentation intervals carry the same frame count through the same
    // nearest-tick rule, so they agree to within one sample of grid phase; the
    // last presentation sample reads the asset only while the trim and the
    // generation both still reach it, and is silent otherwise. A stretch that
    // reconciled the two by resampling would be a rate change the author never
    // asked for, and a read past the trim would leave the declared source.
    const at = range.source.start + index;
    let signal: number;
    if (played) {
      signal = at < range.source.end && at < source.length ? source[at]! : 0;
    } else {
      // Derived only where it is used: a cue playing its asset never needs the
      // stand-in, and a film-length cue that computed one anyway would pay for
      // a sound nobody hears.
      const t = at / plan.sampleRate;
      signal =
        cue.bus === "music"
          ? Math.sin(2 * Math.PI * 110 * t) * 0.18 +
            Math.sin(2 * Math.PI * 165 * t) * 0.12 +
            Math.sin(2 * Math.PI * 220 * t) * 0.08
          : cue.bus === "ambience"
            ? seededNoise(cue.seed, at) * 0.09 +
              Math.sin(2 * Math.PI * 48 * t) * 0.04
            : cue.bus === "effects"
              ? seededNoise(cue.seed, at) * 0.16
              : Math.sin(2 * Math.PI * 175 * t) * 0.08;
    }
    const value = signal * cue.gain * fade;
    pcm[(start + index) * 2] += value;
    pcm[(start + index) * 2 + 1] += value;
  }
};

/** One cue's presentation span and source trim as exclusive sample ranges. */
interface ICueSampleRanges {
  presentation: { start: number; end: number };
  source: { start: number; end: number };
}

/**
 * Place one cue on the sample clock, or refuse it by name.
 *
 * `sourceDurationFrames` is the complete asset on the frame clock: the ceiling
 * the trim must fit inside and nothing else. The builder refuses the same
 * contradictions when it lowers the edit, and the mix refuses them again here
 * because the plan is a public input and a cue that reads outside its source or
 * its film has no sample to mix.
 */
const cueSampleRanges = (
  plan: IAutoMovieProductionSoundPlan,
  cue: IAutoMovieProductionSoundPlan["cues"][number],
): ICueSampleRanges => {
  if (
    Number.isSafeInteger(cue.sourceDurationFrames) === false ||
    cue.sourceDurationFrames <= 0 ||
    Number.isSafeInteger(cue.sourceOffsetFrame) === false ||
    cue.sourceOffsetFrame < 0 ||
    Number.isSafeInteger(cue.durationFrames) === false ||
    cue.durationFrames <= 0 ||
    Number.isSafeInteger(cue.startFrame) === false ||
    cue.startFrame < 0 ||
    cue.sourceOffsetFrame + cue.durationFrames > cue.sourceDurationFrames ||
    cue.startFrame + cue.durationFrames > plan.totalFrames
  )
    throw new Error(
      `Production sound cue "${cue.id}" must play a positive whole-frame span inside its ${cue.sourceDurationFrames}-frame source and the ${plan.totalFrames}-frame film, but reads ${cue.durationFrames} frames from source frame ${cue.sourceOffsetFrame} at film frame ${cue.startFrame}.`,
    );
  const frameRate = resolveProductionFrameRate(plan);
  const interval = (startFrame: number): { start: number; end: number } =>
    productionFrameIntervalToGridTicks({
      startFrame,
      endFrame: startFrame + cue.durationFrames,
      frameRate,
      ticksPerSecond: plan.sampleRate,
      rounding: "nearest",
    });
  return {
    presentation: interval(cue.startFrame),
    source: interval(cue.sourceOffsetFrame),
  };
};

const analyzeProductionSound = (
  plan: IAutoMovieProductionSoundPlan,
  pcm: Float32Array,
): IAutoMovieProductionSoundAnalysis => {
  let peak = 0;
  let longestSilence = 0;
  let silence = 0;
  for (let frame = 0; frame < pcm.length / 2; ++frame) {
    const left = pcm[frame * 2]!;
    const right = pcm[frame * 2 + 1]!;
    peak = Math.max(peak, Math.abs(left), Math.abs(right));
    if (Math.max(Math.abs(left), Math.abs(right)) < 1e-5) {
      silence += 1;
      longestSilence = Math.max(longestSilence, silence);
    } else silence = 0;
  }
  const sampleFrames = pcm.length / 2;
  return {
    version: 1,
    sampleRate: 48_000,
    sampleFrames,
    runtimeSeconds: sampleFrames / plan.sampleRate,
    integratedLoudness: integratedLoudness(pcm, plan.sampleRate),
    samplePeak: peak,
    // The preceding deterministic limiter scales the whole master below one.
    clippingSamples: 0,
    longestSilenceSeconds: longestSilence / plan.sampleRate,
    eventAlignment: plan.events.map((event) => {
      const expectedFrame =
        event.propagation?.boundary === "trimmed-at-segment"
          ? event.frame
          : (event.propagation?.arrivalFrame ?? event.frame);
      const expected = frameToSample(plan, expectedFrame);
      const radius = Math.max(1, frameToSample(plan, 1));
      let peakSample = expected;
      let peakValue = -1;
      for (
        let sample = Math.max(0, expected - radius);
        sample <= Math.min(sampleFrames - 1, expected + radius);
        ++sample
      ) {
        const value = Math.max(
          Math.abs(pcm[sample * 2]!),
          Math.abs(pcm[sample * 2 + 1]!),
        );
        if (value > peakValue) {
          peakValue = value;
          peakSample = sample;
        }
      }
      const frameRate = resolveProductionFrameRate(plan);
      const errorFrames =
        (Math.abs(peakSample - expected) * frameRate.numerator) /
        (plan.sampleRate * frameRate.denominator);
      return {
        id: event.id,
        expectedSeconds: expected / plan.sampleRate,
        peakSeconds: peakSample / plan.sampleRate,
        errorFrames,
        passed: peakValue > 1e-5 && errorFrames <= 1,
      };
    }),
  };
};

const integratedLoudness = (
  pcm: Float32Array,
  sampleRate: number,
): number | null => {
  if (pcm.every((sample) => sample === 0)) return null;
  const weighted = new Float64Array(pcm.length);
  for (let channel = 0; channel < 2; ++channel) {
    const first = biquadChannel(
      pcm,
      channel,
      [1.53512485958697, -2.69169618940638, 1.19839281085285],
      [1, -1.69065929318241, 0.73248077421585],
    );
    const second = biquadChannel(
      first,
      0,
      [1, -2, 1],
      [1, -1.99004745483398, 0.99007225036621],
      1,
    );
    for (let frame = 0; frame < second.length; ++frame)
      weighted[frame * 2 + channel] = second[frame]!;
  }
  const frames = pcm.length / 2;
  const blockFrames = Math.min(frames, Math.round(sampleRate * 0.4));
  const hopFrames = Math.max(1, Math.round(sampleRate * 0.1));
  const energies: number[] = [];
  for (let start = 0; start + blockFrames <= frames; start += hopFrames) {
    let energy = 0;
    for (let frame = start; frame < start + blockFrames; ++frame) {
      const left = weighted[frame * 2]!;
      const right = weighted[frame * 2 + 1]!;
      energy += left * left + right * right;
    }
    energies.push(energy / blockFrames);
    if (start + blockFrames === frames) break;
  }
  const aboveAbsolute = energies.filter(
    (energy) => loudnessOfEnergy(energy) >= -70,
  );
  if (aboveAbsolute.length === 0) return null;
  const relativeGate =
    loudnessOfEnergy(
      aboveAbsolute.reduce((sum, energy) => sum + energy, 0) /
        aboveAbsolute.length,
    ) - 10;
  const gated = aboveAbsolute.filter(
    (energy) => loudnessOfEnergy(energy) >= relativeGate,
  );
  return loudnessOfEnergy(
    gated.reduce((sum, energy) => sum + energy, 0) / gated.length,
  );
};

const biquadChannel = (
  interleaved: ArrayLike<number>,
  channel: number,
  numerator: readonly [number, number, number],
  denominator: readonly [number, number, number],
  channels = 2,
): Float64Array => {
  const frames = Math.floor(interleaved.length / channels);
  const output = new Float64Array(frames);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let frame = 0; frame < frames; ++frame) {
    const input = interleaved[frame * channels + channel]!;
    const value =
      numerator[0] * input +
      numerator[1] * x1 +
      numerator[2] * x2 -
      denominator[1] * y1 -
      denominator[2] * y2;
    output[frame] = value;
    x2 = x1;
    x1 = input;
    y2 = y1;
    y1 = value;
  }
  return output;
};

const loudnessOfEnergy = (energy: number): number =>
  energy <= 0 ? -Infinity : -0.691 + 10 * Math.log10(energy);

const resampleMono = (source: Float32Array, length: number): Float32Array => {
  const output = new Float32Array(length);
  if (source.length === 0) return output;
  if (source.length === 1) {
    output.fill(source[0]!);
    return output;
  }
  for (let index = 0; index < length; ++index) {
    const position =
      length === 1 ? 0 : (index * (source.length - 1)) / (length - 1);
    const left = Math.floor(position);
    const right = Math.min(source.length - 1, left + 1);
    const weight = position - left;
    output[index] = Math.fround(
      source[left]! * (1 - weight) + source[right]! * weight,
    );
  }
  return output;
};

const frameToSample = (
  plan: IAutoMovieProductionSoundPlan,
  frame: number,
): number =>
  productionFrameBoundaryToGridTick({
    frame,
    frameRate: resolveProductionFrameRate(plan),
    ticksPerSecond: plan.sampleRate,
    rounding: "nearest",
  });

const edgeEnvelope = (index: number, length: number, edge: number): number =>
  Math.min(1, index / edge, (length - index) / edge);

const seededNoise = (seed: number, index: number): number => {
  let value = (seed ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return ((value >>> 0) / 0x7fffffff - 1) * 0.999999;
};
