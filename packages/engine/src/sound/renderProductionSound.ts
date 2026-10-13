import { IAutoMovieProductionSoundAnalysis, IAutoMovieProductionSoundPlan, IAutoMovieProductionSoundCue, IAutoMovieProductionDialogueLine, IAutoMovieProductionAcousticResponse, IAutoMovieProductionSoundEvent, IAutoMovieProductionFrameRate } from "@automovie/interface";
import { productionFrameBoundaryToGridTick } from "../film/productionFrameBoundaryToGridTick";
import { productionFrameIntervalToGridTicks } from "../film/productionFrameIntervalToGridTicks";
import { resolveProductionFrameRate } from "../film/resolveProductionFrameRate";
import { IAutoMovieRenderedProductionSound } from "./IAutoMovieRenderedProductionSound";
import { applyAutoMovieInteriorAcousticResponse } from "./applyAutoMovieInteriorAcousticResponse";
import { productionSoundEventTone } from "./productionSoundEventTone";
/**
 * Mix semantic events, authored cue trims and supplied dialogue into a fresh stereo master.
 *
 * @evidence contracts/common.md#principled-implementation Fixed frame-to-sample owners place event/cue/dialogue boundaries; Float32 accumulation, declared event palette, optional propagation/room receipts, cue unit-rate reading and linear dialogue fitting precede a whole-master 0.95 peak limiter and analysis of the exact limited generation.
 * @evidence contracts/common.md#clear-and-simple-design The pure mix receives adopted mono buffers through identity maps, keeping decoding and byte provenance outside engine arithmetic; unavailable room receipts throw, and this public renderer currently has test-only repository reach rather than a wired film-runtime host.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing cue assets produce procedural bus stand-ins and missing dialogue is omitted. Event alignment measures a mixed-master peak within one frame, so another sound can satisfy it; it is not isolated event energy or causal evidence.
 * @evidence contracts/common.md#meaningful-documentation Documents trim/source clocks, optional adopted buffers, limiter and fallback effects; fixed 48kHz stereo and admitted plan quantities are type/caller premises, and trigonometric rounding is not a universal cross-host byte certificate.
 * @evidence contracts/performance.md#efficient-algorithms N master samples plus summed event/cue/dialogue durations drive mixing; each room-response event also allocates/scans a film-length dry buffer and sparse taps, while loudness allocates O(N) filter storage and event windows add O(E*sampleRate/fps) work.
 * @evidence contracts/performance.md#reuse-equivalent-work Cue ranges are calculated once, adopted buffers are validated once per referenced id and per-event gains are shared across samples; the selected tone owner evaluates only the event's expression rather than every palette formula per sample.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns fresh master/analysis; dry, responded, fitted and loudness arrays leave scope after completion/failure, with film-duration-driven storage and no decoder, process, audio device or completed-mix cache.
 * @author Samchon
 */
export const renderProductionSound: (props: { plan: IAutoMovieProductionSoundPlan; dialogue?: ReadonlyMap<string, Float32Array<ArrayBufferLike>> | undefined; assets?: ReadonlyMap<string, Float32Array<ArrayBufferLike>> | undefined; }) => IAutoMovieRenderedProductionSound = (props: {
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
  const ranges: ICueSampleRanges[] = props.plan.cues.map((cue: IAutoMovieProductionSoundCue): ICueSampleRanges => cueSampleRanges(props.plan, cue));
  for (const asset of new Set(props.plan.cues.map((cue: IAutoMovieProductionSoundCue): string => cue.asset))) {
    const source: Float32Array<ArrayBufferLike> | undefined = props.assets?.get(asset);
    if (source !== undefined)
      assertFiniteProductionPcm(source, `audio asset "${asset}"`);
  }
  for (const line of new Set(props.plan.dialogue.map((line: IAutoMovieProductionDialogueLine): string => line.id))) {
    const source: Float32Array<ArrayBufferLike> | undefined = props.dialogue?.get(line);
    if (source !== undefined)
      assertFiniteProductionPcm(source, `dialogue line "${line}"`);
  }
  const sampleFrames: number = frameToSample(props.plan, props.plan.totalFrames);
  const pcm: Float32Array<ArrayBuffer> = new Float32Array(sampleFrames * 2);
  for (const event of props.plan.events) {
    const room: IAutoMovieProductionAcousticResponse | undefined = event.acousticResponse;
    if (room === undefined) mixEvent(pcm, props.plan, event);
    else {
      const dry: Float32Array<ArrayBuffer> = new Float32Array(pcm.length);
      mixEvent(dry, props.plan, event);
      const responded: Float32Array<ArrayBufferLike> = applyAutoMovieInteriorAcousticResponse({
        samples: dry,
        channels: props.plan.channels,
        sampleRate: props.plan.sampleRate,
        response: room,
      });
      for (let index: number = 0; index < pcm.length; ++index)
        pcm[index] += responded[index]!;
    }
  }
  props.plan.cues.forEach((cue: IAutoMovieProductionSoundCue, index: number): void =>
    mixCue(pcm, props.plan, cue, ranges[index]!, props.assets?.get(cue.asset)),
  );
  for (const line of props.plan.dialogue) {
    const source: Float32Array<ArrayBufferLike> | undefined = props.dialogue?.get(line.id);
    if (source === undefined) continue;
    const start: number = frameToSample(props.plan, line.startFrame);
    const end: number = frameToSample(props.plan, line.endFrame);
    const fitted: Float32Array<ArrayBufferLike> = resampleMono(source, Math.max(0, end - start));
    for (
      let index: number = 0;
      index < fitted.length && start + index < sampleFrames;
      ++index
    ) {
      const envelope: number = edgeEnvelope(index, fitted.length, 240);
      const value: number = fitted[index]! * envelope * 0.72;
      pcm[(start + index) * 2] += value;
      pcm[(start + index) * 2 + 1] += value;
    }
  }
  assertFiniteProductionPcm(pcm, "generated production mix");
  let peak: number = 0;
  for (const value of pcm) peak = Math.max(peak, Math.abs(value));
  if (peak > 0.95) {
    const scale: number = 0.95 / peak;
    for (let index: number = 0; index < pcm.length; ++index)
      pcm[index] = Math.fround(pcm[index]! * scale);
  }
  return { pcm, analysis: analyzeProductionSound(props.plan, pcm) };
};

/** Refuse an adopted PCM generation before interpolation or numeric evidence. */
const assertFiniteProductionPcm: (samples: Float32Array<ArrayBufferLike>, source: string) => void = (
  samples: Float32Array,
  source: string,
): void => {
  if (samples.length === 0)
    throw new Error(`Production sound ${source} supplied empty PCM.`);
  for (let index: number = 0; index < samples.length; ++index)
    if (Number.isFinite(samples[index]) === false)
      throw new Error(
        `Production sound ${source} contains a non-finite PCM sample at index ${index}.`,
      );
};

/** Mix the selected fixed event tone from emission or declared arrival, skipping segment-trimmed events; per-event pan/filter/density gains feed the same Float32 accumulation order. */
const mixEvent: (pcm: Float32Array<ArrayBufferLike>, plan: IAutoMovieProductionSoundPlan, event: IAutoMovieProductionSoundEvent) => void = (
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
  const propagation: { profile: string; arrivalFrame: number; arrivalTimeSeconds: number; distanceGain: number; highFrequencyGain: number | null; boundary: "inside-segment" | "carried-across-cut" | "trimmed-at-segment"; } | undefined = event.propagation;
  if (propagation?.boundary === "trimmed-at-segment") return;
  const start: number = frameToSample(plan, propagation?.arrivalFrame ?? event.frame);
  const length: number = Math.round(durationSeconds[event.kind] * plan.sampleRate);
  const left: number = Math.sqrt((1 - event.pan) * 0.5);
  const right: number = Math.sqrt((1 + event.pan) * 0.5);
  const spectralGain: number = propagation?.highFrequencyGain ?? 1;
  let filtered: number = 0;
  for (
    let index: number = 0;
    index < length && start + index < pcm.length / 2;
    ++index
  ) {
    const t: number = index / plan.sampleRate;
    const normalized: number = index / Math.max(1, length - 1);
    const envelope: number = Math.exp(-5 * normalized);
    const noise: number = seededNoise(event.seed, index);
    const base: number = productionSoundEventTone(event.kind, t, normalized, noise);
    const impulse: number = index === 0 ? 1 : 0;
    const dry: number = base * envelope * 0.28 + impulse * 0.5;
    filtered += spectralGain * (dry - filtered);
    // Apply the declared equal-source density model before the master limiter,
    // preserving source-relative levels rather than clipping individual masses.
    const value: number =
      filtered *
      (propagation?.distanceGain ?? event.attenuation) *
      event.densityGain;
    pcm[(start + index) * 2] += value * left;
    pcm[(start + index) * 2 + 1] += value * right;
  }
};

/** Read the admitted source trim at unit sample rate with authored fades, or use the bus stand-in when the asset is absent; no rate reconciliation extends the trim. */
const mixCue: (pcm: Float32Array<ArrayBufferLike>, plan: IAutoMovieProductionSoundPlan, cue: IAutoMovieProductionSoundCue, range: ICueSampleRanges, source: Float32Array<ArrayBufferLike> | undefined) => void = (
  pcm: Float32Array,
  plan: IAutoMovieProductionSoundPlan,
  cue: IAutoMovieProductionSoundPlan["cues"][number],
  range: ICueSampleRanges,
  source: Float32Array | undefined,
): void => {
  if (cue.gain === 0) return;
  const start: number = range.presentation.start;
  const length: number = range.presentation.end - start;
  const fadeIn: number = frameToSample(plan, cue.fadeInFrames);
  const fadeOut: number = frameToSample(plan, cue.fadeOutFrames);
  // Everything constant across the cue, read once. A film-length cue runs this
  // loop tens of millions of times, so a value derived inside it is derived per
  // sample: at half an hour that is the difference between a mix that costs its
  // buffer and one that costs several.
  const played: Float32Array | undefined = source;
  for (let index: number = 0; index < length; ++index) {
    const fade: number =
      Math.min(1, fadeIn === 0 ? 1 : index / fadeIn) *
      Math.min(1, fadeOut === 0 ? 1 : (length - index) / fadeOut);
    // The trim is read at unit rate from its own start tick. Its source and
    // presentation intervals carry the same frame count through the same
    // nearest-tick rule, so they agree to within one sample of grid phase; the
    // last presentation sample reads the asset only while the trim and the
    // generation both still reach it, and is silent otherwise. A stretch that
    // reconciled the two by resampling would be a rate change the author never
    // asked for, and a read past the trim would leave the declared source.
    const at: number = range.source.start + index;
    let signal: number;
    if (played !== undefined) {
      signal = at < range.source.end && at < played.length ? played[at]! : 0;
    } else {
      // Derived only where it is used: a cue playing its asset never needs the
      // stand-in, and a film-length cue that computed one anyway would pay for
      // a sound nobody hears.
      const t: number = at / plan.sampleRate;
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
    const value: number = signal * cue.gain * fade;
    pcm[(start + index) * 2] += value;
    pcm[(start + index) * 2 + 1] += value;
  }
};

/** One cue's presentation span and source trim as exclusive sample ranges. */
interface ICueSampleRanges {
  /** Exclusive sample-frame interval on the master presentation clock. */
  presentation: { start: number; end: number };

  /** Exclusive sample-frame trim on the adopted mono asset's clock. */
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
const cueSampleRanges: (plan: IAutoMovieProductionSoundPlan, cue: IAutoMovieProductionSoundCue) => ICueSampleRanges = (
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
  const frameRate: IAutoMovieProductionFrameRate = resolveProductionFrameRate(plan);
  const interval: (startFrame: number) => { start: number; end: number; } = (startFrame: number): { start: number; end: number } =>
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

/** Analyze the exact limited stereo master: sample peak, longest near-silent run, gated loudness and mixed-master peaks within one frame of event expectations; the latter cannot isolate event energy. */
const analyzeProductionSound: (plan: IAutoMovieProductionSoundPlan, pcm: Float32Array<ArrayBufferLike>) => IAutoMovieProductionSoundAnalysis = (
  plan: IAutoMovieProductionSoundPlan,
  pcm: Float32Array,
): IAutoMovieProductionSoundAnalysis => {
  let peak: number = 0;
  let longestSilence: number = 0;
  let silence: number = 0;
  for (let frame: number = 0; frame < pcm.length / 2; ++frame) {
    const left: number = pcm[frame * 2]!;
    const right: number = pcm[frame * 2 + 1]!;
    peak = Math.max(peak, Math.abs(left), Math.abs(right));
    if (Math.max(Math.abs(left), Math.abs(right)) < 1e-5) {
      silence += 1;
      longestSilence = Math.max(longestSilence, silence);
    } else silence = 0;
  }
  const sampleFrames: number = pcm.length / 2;
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
    eventAlignment: plan.events.map((event: IAutoMovieProductionSoundEvent): { id: string; expectedSeconds: number; peakSeconds: number; errorFrames: number; passed: boolean; } => {
      const expectedFrame: number =
        event.propagation?.boundary === "trimmed-at-segment"
          ? event.frame
          : (event.propagation?.arrivalFrame ?? event.frame);
      const expected: number = frameToSample(plan, expectedFrame);
      const radius: number = Math.max(1, frameToSample(plan, 1));
      let peakSample: number = expected;
      let peakValue: number = -1;
      for (
        let sample: number = Math.max(0, expected - radius);
        sample <= Math.min(sampleFrames - 1, expected + radius);
        ++sample
      ) {
        const value: number = Math.max(
          Math.abs(pcm[sample * 2]!),
          Math.abs(pcm[sample * 2 + 1]!),
        );
        if (value > peakValue) {
          peakValue = value;
          peakSample = sample;
        }
      }
      const frameRate: IAutoMovieProductionFrameRate = resolveProductionFrameRate(plan);
      const errorFrames: number =
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

/** Apply the fixed 48kHz two-stage weighting coefficients, average 400ms blocks at 100ms hops and gate at -70 and relative -10 levels; silent/gated-out input returns null, without external conformance certification. */
const integratedLoudness: (pcm: Float32Array<ArrayBufferLike>, sampleRate: number) => number | null = (
  pcm: Float32Array,
  sampleRate: number,
): number | null => {
  if (pcm.every((sample: number): sample is number => sample === 0)) return null;
  const weighted: Float64Array<ArrayBuffer> = new Float64Array(pcm.length);
  for (let channel: number = 0; channel < 2; ++channel) {
    const first: Float64Array<ArrayBufferLike> = biquadChannel(
      pcm,
      channel,
      [1.53512485958697, -2.69169618940638, 1.19839281085285],
      [1, -1.69065929318241, 0.73248077421585],
    );
    const second: Float64Array<ArrayBufferLike> = biquadChannel(
      first,
      0,
      [1, -2, 1],
      [1, -1.99004745483398, 0.99007225036621],
      1,
    );
    for (let frame: number = 0; frame < second.length; ++frame)
      weighted[frame * 2 + channel] = second[frame]!;
  }
  const frames: number = pcm.length / 2;
  const blockFrames: number = Math.min(frames, Math.round(sampleRate * 0.4));
  const hopFrames: number = Math.max(1, Math.round(sampleRate * 0.1));
  const energies: number[] = [];
  for (let start: number = 0; start + blockFrames <= frames; start += hopFrames) {
    let energy: number = 0;
    for (let frame: number = start; frame < start + blockFrames; ++frame) {
      const left: number = weighted[frame * 2]!;
      const right: number = weighted[frame * 2 + 1]!;
      energy += left * left + right * right;
    }
    energies.push(energy / blockFrames);
    if (start + blockFrames === frames) break;
  }
  const aboveAbsolute: number[] = energies.filter(
    (energy: number): boolean => loudnessOfEnergy(energy) >= -70,
  );
  if (aboveAbsolute.length === 0) return null;
  const relativeGate: number =
    loudnessOfEnergy(
      aboveAbsolute.reduce((sum: number, energy: number): number => sum + energy, 0) /
        aboveAbsolute.length,
    ) - 10;
  const gated: number[] = aboveAbsolute.filter(
    (energy: number): boolean => loudnessOfEnergy(energy) >= relativeGate,
  );
  return loudnessOfEnergy(
    gated.reduce((sum: number, energy: number): number => sum + energy, 0) / gated.length,
  );
};

/** Filter one channel with the supplied second-order numerator/denominator in its original recurrence order, returning a fresh Float64 mono generation and local two-sample histories. */
const biquadChannel: (interleaved: ArrayLike<number>, channel: number, numerator: readonly [number, number, number], denominator: readonly [number, number, number], channels?: number) => Float64Array<ArrayBufferLike> = (
  interleaved: ArrayLike<number>,
  channel: number,
  numerator: readonly [number, number, number],
  denominator: readonly [number, number, number],
  channels: number = 2,
): Float64Array => {
  const frames: number = Math.floor(interleaved.length / channels);
  const output: Float64Array<ArrayBuffer> = new Float64Array(frames);
  let x1: number = 0;
  let x2: number = 0;
  let y1: number = 0;
  let y2: number = 0;
  for (let frame: number = 0; frame < frames; ++frame) {
    const input: number = interleaved[frame * channels + channel]!;
    const value: number =
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

/** Map nonpositive mean-square energy to negative infinity, otherwise use the fixed -0.691 + 10log10(energy) loudness law consumed by the gate. */
const loudnessOfEnergy: (energy: number) => number = (energy: number): number =>
  energy <= 0 ? -Infinity : -0.691 + 10 * Math.log10(energy);

/** Fit adopted mono samples by endpoint-aligned linear interpolation and Float32 rounding; singleton sources fill the output, and a one-sample output selects the first source sample. */
const resampleMono: (source: Float32Array<ArrayBufferLike>, length: number) => Float32Array<ArrayBufferLike> = (source: Float32Array, length: number): Float32Array => {
  const output: Float32Array<ArrayBuffer> = new Float32Array(length);
  if (source.length === 0) return output;
  if (source.length === 1) {
    output.fill(source[0]!);
    return output;
  }
  for (let index: number = 0; index < length; ++index) {
    const position: number =
      length === 1 ? 0 : (index * (source.length - 1)) / (length - 1);
    const left: number = Math.floor(position);
    const right: number = Math.min(source.length - 1, left + 1);
    const weight: number = position - left;
    output[index] = Math.fround(
      source[left]! * (1 - weight) + source[right]! * weight,
    );
  }
  return output;
};

/** Delegate a frame boundary to the shared rational film-clock nearest-tick rule at the plan's sample rate, including its numeric admission failures. */
const frameToSample: (plan: IAutoMovieProductionSoundPlan, frame: number) => number = (
  plan: IAutoMovieProductionSoundPlan,
  frame: number,
): number =>
  productionFrameBoundaryToGridTick({
    frame,
    frameRate: resolveProductionFrameRate(plan),
    ticksPerSecond: plan.sampleRate,
    rounding: "nearest",
  });

/** Return the lesser of unity and the two edge-distance ratios for the fixed positive edge length; the last included sample need not reach exact zero. */
const edgeEnvelope: (index: number, length: number, edge: number) => number = (index: number, length: number, edge: number): number =>
  Math.min(1, index / edge, (length - index) / edge);

/** Derive one stateless signed noise sample by fixed 32bit multiply/xorshift operations over seed and sample index; this seed stream is not content identity. */
const seededNoise: (seed: number, index: number) => number = (seed: number, index: number): number => {
  let value: number = (seed ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return ((value >>> 0) / 0x7fffffff - 1) * 0.999999;
};
