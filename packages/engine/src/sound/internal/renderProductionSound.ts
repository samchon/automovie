import {
  IAutoMovieProductionAcousticResponse,
  IAutoMovieProductionDialogueLine,
  IAutoMovieProductionFrameRate,
  IAutoMovieProductionSoundCue,
  IAutoMovieProductionSoundEvent,
  IAutoMovieProductionSoundPlan,
  type IAutoMovieRandom,
  type IAutoMovieRenderProductionSound,
  type IAutoMovieRenderedProductionSound,
} from "@automovie/interface";

import { productionFrameBoundaryToGridTick } from "../../film/internal/productionFrameBoundaryToGridTick";
import { productionFrameIntervalToGridTicks } from "../../film/internal/productionFrameIntervalToGridTicks";
import { resolveProductionFrameRate } from "../../film/internal/resolveProductionFrameRate";
import { overflowsBinary64 } from "../../math/internal/overflowsBinary64";
import { AutoMovieEngineRandom } from "../../random/index";


import { analyzeProductionSound } from "./analyzeProductionSound";
import { applyInteriorAcousticResponse } from "./applyInteriorAcousticResponse";
import { levelProductionDialogueLine } from "./levelProductionDialogueLine";
import { mixProductionRoomTone } from "./mixProductionRoomTone";
import { productionScoreDuckingEnvelope } from "./productionScoreDuckingEnvelope";
import { productionSoundEventTone } from "./productionSoundEventTone";
import { resolveProductionLoudness } from "./resolveProductionLoudness";

/*
 * Mix semantic events, authored cue trims and supplied dialogue into a fresh
 * stereo mix, with the plan's room-tone beds generated on the ambience bus
 * (`mixProductionRoomTone`). When enabled, score ducking attenuates the music
 * bus around the placed dialogue with adopted PCM.
 *
 * Loudness follows the production's intent, or EBU R 128 without one
 * (`resolveProductionLoudness`): each dialogue line is levelled to the dialogue
 * target as placed (`levelProductionDialogueLine`). The mix has no master
 * stage, so its samples may leave [−1, 1]; `masterProductionSound` brings it to
 * the integrated target under the true-peak ceiling.
 */
export function renderProductionSound(
  props: IAutoMovieRenderProductionSound.IProps,
): IAutoMovieRenderedProductionSound {
  // Every cue is placed on the sample clock before any sample is mixed, so a
  // cue that contradicts its own source is refused before the work it would
  // have wasted, and each placement is computed once for the mix that follows.
  const ranges: ICueSampleRanges[] = props.plan.cues.map(
    (cue: IAutoMovieProductionSoundCue): ICueSampleRanges =>
      cueSampleRanges(props.plan, cue),
  );
  for (const asset of new Set(
    props.plan.cues.map(
      (cue: IAutoMovieProductionSoundCue): string => cue.asset,
    ),
  )) {
    const source: Float32Array<ArrayBufferLike> | undefined =
      props.assets?.get(asset);
    if (source !== undefined)
      assertFiniteProductionPcm(source, `audio asset "${asset}"`);
  }
  for (const line of new Set(
    props.plan.dialogue.map(
      (line: IAutoMovieProductionDialogueLine): string => line.id,
    ),
  )) {
    const source: Float32Array<ArrayBufferLike> | undefined =
      props.dialogue?.get(line);
    if (source !== undefined)
      assertFiniteProductionPcm(source, `dialogue line "${line}"`);
  }
  const targets: Pick<
    IAutoMovieRenderedProductionSound.ILoudness,
    "intent" | "source" | "dialogueLufs" | "ceilingDbtp"
  > = resolveProductionLoudness(props.loudness);
  const sampleFrames: number = frameToSample(
    props.plan,
    props.plan.totalFrames,
  );
  const sampleAtFrame: (frame: number) => number = (frame: number): number =>
    frameToSample(props.plan, frame);
  const scoreEnvelope: Float32Array | undefined =
    productionScoreDuckingEnvelope(
      props.plan,
      props.dialogue,
      sampleFrames,
      sampleAtFrame,
    );
  const pcm: Float32Array<ArrayBuffer> = new Float32Array(sampleFrames * 2);
  for (const event of props.plan.events) {
    const room: IAutoMovieProductionAcousticResponse | undefined =
      event.acousticResponse;
    if (room === undefined) mixEvent(pcm, props.plan, event);
    else {
      const dry: Float32Array<ArrayBuffer> = new Float32Array(pcm.length);
      mixEvent(dry, props.plan, event);
      const responded: Float32Array<ArrayBufferLike> =
        applyInteriorAcousticResponse({
          samples: dry,
          channels: props.plan.channels,
          sampleRate: props.plan.sampleRate,
          response: room,
        });
      for (let index: number = 0; index < pcm.length; ++index)
        pcm[index] += responded[index]!;
    }
  }
  props.plan.cues.forEach(
    (cue: IAutoMovieProductionSoundCue, index: number): void =>
      mixCue(
        pcm,
        props.plan,
        cue,
        ranges[index]!,
        props.assets?.get(cue.asset),
        cue.bus === "music" ? scoreEnvelope : undefined,
      ),
  );
  mixProductionRoomTone(pcm, props.plan);
  const lines: IAutoMovieRenderedProductionSound.ILoudness["lines"] = [];
  for (const line of props.plan.dialogue) {
    const source: Float32Array<ArrayBufferLike> | undefined =
      props.dialogue?.get(line.id);
    if (source === undefined) continue;
    // The line plays at unit rate from its start tick: its speech span was
    // derived from this very sample count, so a line longer than its span is
    // a plan that disagrees with its own bytes, and fitting it to the span
    // would change its tempo and pitch.
    const start: number = frameToSample(props.plan, line.startFrame);
    const end: number = frameToSample(props.plan, line.endFrame);
    if (source.length > end - start || end > sampleFrames)
      throw new Error(
        `Production sound dialogue line "${line.id}" has ${source.length} samples, but its speech span from frame ${line.startFrame} to ${line.endFrame} holds ${Math.max(0, end - start)} samples inside the ${sampleFrames}-sample film.`,
      );

    // Each line is levelled as it is placed, so a line's level follows its
    // measured loudness rather than whatever level its generator wrote.
    const fade: (index: number) => number = (index: number): number =>
      edgeEnvelope(index, source.length, 240);
    const levelled: { measuredLufs: number; gainDb: number } =
      levelProductionDialogueLine({
        id: line.id,
        samples: source,
        fade,
        targetLufs: targets.dialogueLufs,
      });
    lines.push({ id: line.id, ...levelled });
    const gain: number = 10 ** (levelled.gainDb / 20);
    for (let index: number = 0; index < source.length; ++index) {
      const value: number = source[index]! * fade(index) * gain;
      accumulate(pcm, (start + index) * 2, value);
      accumulate(pcm, (start + index) * 2 + 1, value);
    }
  }
  assertFiniteProductionPcm(pcm, "generated production mix");
  return {
    pcm,
    analysis: analyzeProductionSound(props.plan, pcm, sampleAtFrame),
    loudness: { ...targets, lines },
  };
}

/*
 * Refuse an adopted PCM generation before interpolation or numeric evidence.
 */
const assertFiniteProductionPcm: (
  samples: Float32Array<ArrayBufferLike>,
  source: string,
) => void = (samples: Float32Array, source: string): void => {
  if (samples.length === 0)
    throw new Error(`Production sound ${source} supplied empty PCM.`);
};

/*
 * Mix the selected fixed event tone from emission or declared arrival, skipping
 * segment-trimmed events; per-event pan/filter/density gains feed the same
 * Float32 accumulation order.
 */
const mixEvent: (
  pcm: Float32Array<ArrayBufferLike>,
  plan: IAutoMovieProductionSoundPlan,
  event: IAutoMovieProductionSoundEvent,
) => void = (
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
  const propagation:
    | {
        profile: string;
        arrivalFrame: number;
        arrivalTimeSeconds: number;
        distanceGain: number;
        highFrequencyGain: number | null;
        boundary:
          | "inside-segment"
          | "carried-across-cut"
          | "trimmed-at-segment";
      }
    | undefined = event.propagation;
  if (propagation?.boundary === "trimmed-at-segment") return;
  const start: number = frameToSample(
    plan,
    propagation?.arrivalFrame ?? event.frame,
  );
  const length: number = Math.round(
    durationSeconds[event.kind] * plan.sampleRate,
  );
  const left: number = Math.sqrt((1 - event.pan) * 0.5);
  const right: number = Math.sqrt((1 + event.pan) * 0.5);
  const spectralGain: number = propagation?.highFrequencyGain ?? 1;
  let filtered: number = 0;
  const stream: IAutoMovieRandom = noiseStream(event.seed);
  for (
    let index: number = 0;
    index < length && start + index < pcm.length / 2;
    ++index
  ) {
    const t: number = index / plan.sampleRate;
    const normalized: number = index / Math.max(1, length - 1);
    const envelope: number = Math.exp(-5 * normalized);
    const noise: number = seededNoise(stream, index);
    const base: number = productionSoundEventTone(
      event.kind,
      t,
      normalized,
      noise,
    );
    const impulse: number = index === 0 ? 1 : 0;
    const dry: number = base * envelope * 0.28 + impulse * 0.5;
    filtered += spectralGain * (dry - filtered);
    // Apply the declared equal-source density model before the master limiter,
    // preserving source-relative levels rather than clipping individual masses.
    const value: number =
      filtered *
      (propagation?.distanceGain ?? event.attenuation) *
      event.densityGain;
    accumulate(pcm, (start + index) * 2, value * left);
    accumulate(pcm, (start + index) * 2 + 1, value * right);
  }
};

/*
 * Read the admitted source trim at unit sample rate with authored fades, or use
 * the bus stand-in when the asset is absent; no rate reconciliation extends the
 * trim.
 */
const mixCue: (
  pcm: Float32Array<ArrayBufferLike>,
  plan: IAutoMovieProductionSoundPlan,
  cue: IAutoMovieProductionSoundCue,
  range: ICueSampleRanges,
  source: Float32Array<ArrayBufferLike> | undefined,
  scoreEnvelope: Float32Array | undefined,
) => void = (
  pcm: Float32Array,
  plan: IAutoMovieProductionSoundPlan,
  cue: IAutoMovieProductionSoundPlan["cues"][number],
  range: ICueSampleRanges,
  source: Float32Array | undefined,
  scoreEnvelope: Float32Array | undefined,
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
  const stream: IAutoMovieRandom = noiseStream(cue.seed);
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
            ? seededNoise(stream, at) * 0.09 +
              Math.sin(2 * Math.PI * 48 * t) * 0.04
            : cue.bus === "effects"
              ? seededNoise(stream, at) * 0.16
              : Math.sin(2 * Math.PI * 175 * t) * 0.08;
    }
    const scoreGain: number = scoreEnvelope?.[start + index] ?? 1;
    const value: number = signal * cue.gain * fade * scoreGain;
    accumulate(pcm, (start + index) * 2, value);
    accumulate(pcm, (start + index) * 2 + 1, value);
  }
};

/*
 * One cue's presentation span and source trim as exclusive sample ranges.
 */
interface ICueSampleRanges {
  /*
   * Exclusive sample-frame interval on the master presentation clock.
   */
  presentation: { start: number; end: number };

  /*
   * Exclusive sample-frame trim on the adopted mono asset's clock.
   */
  source: { start: number; end: number };
}

/*
 * Place one cue on the sample clock, or refuse it by name.
 *
 * `sourceDurationFrames` is the complete asset on the frame clock: the ceiling
 * the trim must fit inside and nothing else. The builder refuses the same
 * contradictions when it lowers the edit, and the mix refuses them again here
 * because the plan is a public input and a cue that reads outside its source or
 * its film has no sample to mix.
 */
const cueSampleRanges: (
  plan: IAutoMovieProductionSoundPlan,
  cue: IAutoMovieProductionSoundCue,
) => ICueSampleRanges = (
  plan: IAutoMovieProductionSoundPlan,
  cue: IAutoMovieProductionSoundPlan["cues"][number],
): ICueSampleRanges => {
  if (
    cue.sourceDurationFrames <= 0 ||
    cue.sourceOffsetFrame < 0 ||
    cue.durationFrames <= 0 ||
    cue.startFrame < 0 ||
    cue.sourceOffsetFrame + cue.durationFrames > cue.sourceDurationFrames ||
    cue.startFrame + cue.durationFrames > plan.totalFrames
  )
    throw new Error(
      `Production sound cue "${cue.id}" must play a positive whole-frame span inside its ${cue.sourceDurationFrames}-frame source and the ${plan.totalFrames}-frame film, but reads ${cue.durationFrames} frames from source frame ${cue.sourceOffsetFrame} at film frame ${cue.startFrame}.`,
    );
  const frameRate: IAutoMovieProductionFrameRate =
    resolveProductionFrameRate(plan);
  const interval: (startFrame: number) => { start: number; end: number } = (
    startFrame: number,
  ): { start: number; end: number } =>
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

/*
 * Delegate a frame boundary to the shared rational film-clock nearest-tick rule
 * at the plan's sample rate, including its numeric admission failures.
 */
const frameToSample: (
  plan: IAutoMovieProductionSoundPlan,
  frame: number,
) => number = (plan: IAutoMovieProductionSoundPlan, frame: number): number =>
  productionFrameBoundaryToGridTick({
    frame,
    frameRate: resolveProductionFrameRate(plan),
    ticksPerSecond: plan.sampleRate,
    rounding: "nearest",
  });

/*
 * Return the lesser of unity and the two edge-distance ratios for the fixed
 * positive edge length; the last included sample need not reach exact zero.
 */
const edgeEnvelope: (index: number, length: number, edge: number) => number = (
  index: number,
  length: number,
  edge: number,
): number => Math.min(1, index / edge, (length - index) / edge);

/*
 * The cue seed's pinned counter-based Philox stream (`createRandomImplementation`),
 * prepared once per mixed cue or event; this seed stream is not content
 * identity.
 */
const noiseStream: (seed: number) => IAutoMovieRandom = (
  seed: number,
): IAutoMovieRandom =>
  AutoMovieEngineRandom.createRandom(AutoMovieEngineRandom.deriveSeed(String(seed), "noise"));

/*
 * One stateless signed noise sample in (-1, 1): the prepared stream read at the
 * sample index.
 */
const seededNoise: (stream: IAutoMovieRandom, index: number) => number = (
  stream: IAutoMovieRandom,
  index: number,
): number => (2 * stream.float(index) - 1) * 0.999999;

/*
 * Add one value to the Float32 mix, refusing the sum where it leaves the
 * Float32 range: the limiter downstream would otherwise read an infinity.
 */
function accumulate(
  pcm: Float32Array<ArrayBufferLike>,
  at: number,
  value: number,
): void {
  pcm[at] += value;
  if (overflowsBinary64(pcm[at]!))
    throw new Error(
      `Production sound generated production mix overflows the Float32 range at index ${at}.`,
    );
}
