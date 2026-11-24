import type {
  AutoMovieViseme,
  IAutoMovieDialogueMouthRange,
  IAutoMovieDialogueSpeakerBinding,
  IAutoMovieDialogueVisemeCompilation,
  IAutoMovieJoinDialogueVisemes,
  IAutoMovieProductionFrameRate,
} from "@automovie/interface";

import { productionFrameBoundaryToGridTick } from "../film/productionFrameBoundaryToGridTick";
import { resolveProductionFrameRate } from "../film/resolveProductionFrameRate";

/**
 * Bind a line's timed visemes to its speaker's actor and place them on the
 * emission clock.
 *
 * The emission clock is the one the mix places the line's samples on, which
 * also ends its speech span (`productionSpeechEndFrame`): the decoded line
 * holds `n = round(sourceSamples × sampleRate / sourceSampleRate)` samples from
 * the start frame's sample tick, and frame boundaries sit on their nearest
 * ticks. A viseme bound `s` plays at offset `s × n / sourceSamples` into the
 * decoded line, within half a sample of `s × sampleRate / sourceSampleRate`, so
 * the receipt's last bound lands on the decoded line's last sample and never
 * past the span's end frame. Inside a frame the frame position runs linearly
 * between its two boundary ticks. No propagation delay is added. Pauses between
 * visemes become `sil` ranges, so a pause inside a line closes the mouth. The
 * weights layer over the actor's authored expression
 * (`mouth-layer-over-authored-expression`).
 *
 * @param props The line, the film's speaker bindings, the timed visemes, the
 *   line's model-native rate and count, and the plan clock.
 * @returns The join outcome, with the timeline when it is available.
 */
export const joinAutoMovieDialogueVisemes: (
  props: IAutoMovieJoinDialogueVisemes.IProps,
) => IAutoMovieDialogueVisemeCompilation = (
  props: IAutoMovieJoinDialogueVisemes.IProps,
): IAutoMovieDialogueVisemeCompilation => {
  if (props.line.speaker === undefined)
    return {
      join: { status: "not-run", reason: "speaker-not-declared" },
      timeline: null,
    };
  const bindings: IAutoMovieDialogueSpeakerBinding[] = props.bindings.filter(
    (binding: IAutoMovieDialogueSpeakerBinding): boolean =>
      binding.speaker === props.line.speaker,
  );
  if (bindings.length === 0)
    return {
      join: { status: "not-run", reason: "speaker-actor-not-found" },
      timeline: null,
    };
  if (bindings.length > 1)
    return {
      join: { status: "not-run", reason: "speaker-actor-ambiguous" },
      timeline: null,
    };
  const binding: IAutoMovieDialogueSpeakerBinding = bindings[0]!;
  if (binding.actor.trim().length === 0)
    throw new Error("dialogue actor binding must not be blank");
  if (props.visemes.length === 0)
    throw new Error(`dialogue line "${props.line.id}" has no viseme timing`);
  if (
    !Number.isSafeInteger(props.line.startFrame) ||
    !Number.isSafeInteger(props.line.endFrame) ||
    props.line.startFrame < 0 ||
    props.line.endFrame <= props.line.startFrame ||
    !(props.sourceSampleRate > 0) ||
    !Number.isSafeInteger(props.sourceSamples) ||
    props.sourceSamples <= 0
  )
    throw new Error(
      `dialogue line "${props.line.id}" has an invalid range, rate or sample count`,
    );

  const frame: (sample: number) => number = emissionFrame(props);
  const ranges: IAutoMovieDialogueMouthRange[] = [];
  let cursor: number = props.visemes[0]!.startSample;
  for (const [index, viseme] of props.visemes.entries()) {
    if (!VISEMES.has(viseme.viseme))
      throw new Error(
        `dialogue line "${props.line.id}" viseme[${index}] has unsupported mouth target "${String(viseme.viseme)}"`,
      );
    if (
      !Number.isFinite(viseme.startSample) ||
      !Number.isFinite(viseme.endSample) ||
      viseme.startSample < cursor ||
      viseme.startSample < 0 ||
      viseme.endSample <= viseme.startSample ||
      viseme.endSample > props.sourceSamples ||
      frame(viseme.endSample) > props.line.endFrame
    )
      throw new Error(
        `dialogue line "${props.line.id}" viseme[${index}] is outside or overlaps its emission range`,
      );
    if (viseme.startSample > cursor)
      ranges.push({
        startFrame: frame(cursor),
        endFrame: frame(viseme.startSample),
        viseme: "sil",
      });
    ranges.push({
      startFrame: frame(viseme.startSample),
      endFrame: frame(viseme.endSample),
      viseme: viseme.viseme,
    });
    cursor = viseme.endSample;
  }
  return {
    join: {
      status: "available",
      actor: binding.actor,
      timing: "emission",
      composition: "mouth-layer-over-authored-expression",
    },
    timeline: { line: props.line.id, actor: binding.actor, ranges },
  };
};

/**
 * The emission-clock frame of a source sample bound: its offset into the
 * decoded line, `s × n / sourceSamples`, added to the start frame's tick, then
 * read between the nearest-tick boundaries of the frame holding that tick.
 *
 * The start of frame `f` is `tick(f)`; a tick `T` with `tick(f) ≤ T < tick(f +
 * 1)` reads as `f + (T − tick(f)) / (tick(f + 1) − tick(f))`, so a boundary
 * tick reads as its whole frame. The closed-form guess `floor(T × numerator /
 * (denominator × sampleRate))` is within one frame, because nearest rounding
 * moves a boundary by at most half a tick, so each adjustment loop runs at most
 * once.
 */
const emissionFrame: (
  props: IAutoMovieJoinDialogueVisemes.IProps,
) => (sample: number) => number = (
  props: IAutoMovieJoinDialogueVisemes.IProps,
): ((sample: number) => number) => {
  const rate: IAutoMovieProductionFrameRate = resolveProductionFrameRate(
    props.clock,
  );
  const tick: (frame: number) => number = (frame: number): number =>
    productionFrameBoundaryToGridTick({
      frame,
      frameRate: rate,
      ticksPerSecond: props.clock.sampleRate,
      rounding: "nearest",
    });
  const decoded: number = Math.round(
    (props.sourceSamples * props.clock.sampleRate) / props.sourceSampleRate,
  );
  const origin: number = tick(props.line.startFrame);
  return (sample: number): number => {
    const at: number = origin + (sample * decoded) / props.sourceSamples;
    let whole: number = Math.max(
      0,
      Math.floor(
        (at * rate.numerator) / (rate.denominator * props.clock.sampleRate),
      ),
    );
    while (whole > 0 && tick(whole) > at) --whole;
    while (tick(whole + 1) <= at) ++whole;
    const from: number = tick(whole);
    return whole + (at - from) / (tick(whole + 1) - from);
  };
};

/**
 * The 15 MPEG-4 visemes; a timed viseme a receipt reports is checked against
 * them at runtime.
 */
const VISEMES: ReadonlySet<AutoMovieViseme> = new Set<AutoMovieViseme>([
  "sil",
  "PP",
  "FF",
  "TH",
  "DD",
  "kk",
  "CH",
  "SS",
  "nn",
  "RR",
  "aa",
  "E",
  "I",
  "O",
  "U",
]);
