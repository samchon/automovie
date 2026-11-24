import {
  joinAutoMovieDialogueVisemes,
  sampleAutoMovieDialogueExpression,
} from "@automovie/engine";
import type {
  IAutoMovieDialogueExpressionLayers,
  IAutoMovieDialogueVisemeCompilation,
  IAutoMovieExpression,
  IAutoMovieHumanVisemeWeights,
  IAutoMovieProductionDialogueLine,
  IAutoMovieProductionViseme,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";
import { test12ValuesClose } from "../internal/test12ValuesClose";

const line: (speaker?: string | null) => IAutoMovieProductionDialogueLine = (
  speaker: string | null = "narrator",
): IAutoMovieProductionDialogueLine => ({
  id: "line",
  text: "A line",
  language: "en",
  ...(speaker === null ? {} : { speaker }),
  startFrame: 10,
  endFrame: 20,
});

// At 24 fps and 48 kHz one frame is 2 000 samples, so from the line's start
// frame 10 these shares fall on frames 12..15 and 17..19.
const visemes: IAutoMovieProductionViseme[] = [
  { phoneme: "a", viseme: "aa", startSample: 4_000, endSample: 10_000 },
  { phoneme: "i", viseme: "I", startSample: 14_000, endSample: 18_000 },
];

/** The rates every join below uses. */
const rates: { sourceSampleRate: number; fps: number } = {
  sourceSampleRate: 48_000,
  fps: 24,
};

/** The viseme with the largest weight. */
const heaviest = (weights: IAutoMovieHumanVisemeWeights): string =>
  Object.entries(weights).reduce(
    (best: [string, number], entry: [string, number | undefined]) =>
      (entry[1] ?? 0) > best[1] ? [entry[0], entry[1] ?? 0] : best,
    ["", -1],
  )[0];

/**
 * Supplied emission-frame visemes join explicitly, preserve gaps, and seek
 * without history.
 *
 * Scenarios:
 *
 * 1. A line from frame 10 to 20 bound to one actor, with visemes over samples 4
 *    000..10 000 and 14 000..18 000 at 48 kHz and 24 fps, compiles an available
 *    emission-timed join with ranges 12..15, a `sil` pause 15..17 and 17..19.
 * 2. Sampling frame 13, then pause frame 16, then frame 13 again leads with `aa`,
 *    then `sil`, then the same `aa` weights, beside the authored expression
 *    object, unchanged.
 * 3. A line without a speaker, a speaker with no binding, and a speaker bound
 *    twice each return their own `not-run` reason.
 * 4. No viseme timing, overlapping visemes, fractional, negative or reversed line
 *    ranges, and empty, negative or overrunning viseme shares are each refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls joinAutoMovieDialogueVisemes with explicit speaker bindings and supplied timing, then sampleAutoMovieDialogueExpression at active/gap/backward-seek frames. Asserts the complete ordered timeline, separate authored/mouth layers, borrowed authored identity, closed not-run reasons, and malformed timing refusals.
 * @evidence contracts/development/testing.md#independent-expectations Literal line [10,20), 2 000 samples per frame and the authored shares determine three ranges with the pause as `sil`. Frame 13 lies inside the aa range and frame 16 inside the pause, so they must lead with aa and sil, and the authored sad intensity remains 0.75; these expectations do not call the join or sampler to calculate their answers.
 * @evidence contracts/development/testing.md#distinguishing-cases Active-gap-active seeking distinguishes range selection from retained playback state; absent speaker, absent actor and duplicate bindings retain different reasons. Empty/overlapping/out-of-line/negative timing each require the stated Error cause; coarticulation bounds belong to `test_engine_dialogue_viseme_coarticulation`.
 * @evidence contracts/development/testing.md#execution-ownership Uses local timing/binding/expression records and synchronous pure APIs with existing throwsError and structural numeric comparator, without audio, scene/actor application, clocks, global replacement or a new host. Fixture timing does not authenticate final audio bytes, prove lip synchrony, or certify production pipeline wiring.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A line from frame 10 to 20 bound to one actor, with visemes at 12..15 and).
 */
export function test_engine_dialogue_viseme_join(): void {
  const compiled: IAutoMovieDialogueVisemeCompilation =
    joinAutoMovieDialogueVisemes({
      line: line(),
      bindings: [{ speaker: "narrator", actor: "actor" }],
      visemes,
      ...rates,
    });
  if (compiled.timeline === null)
    throw new Error("positive dialogue join unexpectedly produced no timeline");
  TestValidator.equals(
    "an explicit speaker join creates a gap-free emission-clock timeline",
    {
      join: compiled.join,
      ranges: compiled.timeline.ranges,
    },
    {
      join: {
        status: "available",
        actor: "actor",
        timing: "emission",
        composition: "mouth-layer-over-authored-expression",
      },
      ranges: [
        { startFrame: 12, endFrame: 15, viseme: "aa" },
        { startFrame: 15, endFrame: 17, viseme: "sil" },
        { startFrame: 17, endFrame: 19, viseme: "I" },
      ],
    },
  );

  const authored: IAutoMovieExpression = {
    preset: "sad",
    intensity: 0.75,
    blendshapes: null,
  };
  const active: IAutoMovieDialogueExpressionLayers =
    sampleAutoMovieDialogueExpression({
      timeline: compiled.timeline,
      frame: 13,
      fps: 24,
      authored,
    });
  const gapAfterSeek: IAutoMovieDialogueExpressionLayers =
    sampleAutoMovieDialogueExpression({
      timeline: compiled.timeline,
      frame: 16,
      fps: 24,
      authored,
    });
  const activeAgain: IAutoMovieDialogueExpressionLayers =
    sampleAutoMovieDialogueExpression({
      timeline: compiled.timeline,
      frame: 13,
      fps: 24,
      authored,
    });
  TestValidator.predicate(
    "sampling leaves authored expression values unchanged",
    test12ValuesClose(authored, {
      preset: "sad",
      intensity: 0.75,
      blendshapes: null,
    }),
  );
  TestValidator.predicate(
    "mouth-only sampling preserves authored emotion and arbitrary seek",
    heaviest(active.mouth.visemes) === "aa" &&
      heaviest(gapAfterSeek.mouth.visemes) === "sil" &&
      JSON.stringify(activeAgain.mouth.visemes) ===
        JSON.stringify(active.mouth.visemes) &&
      active.authored === authored &&
      gapAfterSeek.authored === authored,
  );

  TestValidator.equals(
    "missing and ambiguous speaker facts remain closed not-run outcomes",
    {
      missingSpeaker: joinAutoMovieDialogueVisemes({
        line: line(null),
        bindings: [],
        visemes,
        ...rates,
      }).join,
      missingActor: joinAutoMovieDialogueVisemes({
        line: line(),
        bindings: [],
        visemes,
        ...rates,
      }).join,
      ambiguous: joinAutoMovieDialogueVisemes({
        line: line(),
        bindings: [
          { speaker: "narrator", actor: "one" },
          { speaker: "narrator", actor: "two" },
        ],
        visemes,
        ...rates,
      }).join,
    },
    {
      missingSpeaker: { status: "not-run", reason: "speaker-not-declared" },
      missingActor: { status: "not-run", reason: "speaker-actor-not-found" },
      ambiguous: { status: "not-run", reason: "speaker-actor-ambiguous" },
    },
  );

  TestValidator.equals(
    "corrupt final timing and invalid sampling are refused",
    {
      absentTiming: throwsError(
        (): IAutoMovieDialogueVisemeCompilation =>
          joinAutoMovieDialogueVisemes({
            line: line(),
            bindings: [{ speaker: "narrator", actor: "actor" }],
            visemes: [],
            ...rates,
          }),
        "no viseme timing",
      ),
      overlap: throwsError(
        (): IAutoMovieDialogueVisemeCompilation =>
          joinAutoMovieDialogueVisemes({
            line: line(),
            bindings: [{ speaker: "narrator", actor: "actor" }],
            visemes: [
              {
                phoneme: "a",
                viseme: "aa",
                startSample: 4_000,
                endSample: 12_000,
              },
              {
                phoneme: "i",
                viseme: "I",
                startSample: 10_000,
                endSample: 16_000,
              },
            ],
            ...rates,
          }),
        "overlaps",
      ),
      badFrame: throwsError(
        (): IAutoMovieDialogueExpressionLayers =>
          sampleAutoMovieDialogueExpression({
            timeline: compiled.timeline!,
            frame: Number.NaN,
            fps: 24,
            authored: null,
          }),
        "finite",
      ),
    },
    { absentTiming: true, overlap: true, badFrame: true },
  );

  const joinWith: (props: {
    line?: IAutoMovieProductionDialogueLine;
    visemes?: IAutoMovieProductionViseme[];
    actor?: string;
  }) => IAutoMovieDialogueVisemeCompilation = (props: {
    line?: IAutoMovieProductionDialogueLine;
    visemes?: IAutoMovieProductionViseme[];
    actor?: string;
  }): IAutoMovieDialogueVisemeCompilation =>
    joinAutoMovieDialogueVisemes({
      line: props.line ?? line(),
      bindings: [
        {
          speaker: "narrator",
          actor: props.actor === undefined ? "actor" : props.actor,
        },
      ],
      visemes: props.visemes ?? visemes,
      ...rates,
    });
  TestValidator.equals(
    "every malformed line and viseme boundary is refused at the join",
    {
      fractionalLineStart: throwsError(
        (): IAutoMovieDialogueVisemeCompilation =>
          joinWith({ line: { ...line(), startFrame: 10.5 } }),
        "invalid range",
      ),
      fractionalLineEnd: throwsError(
        (): IAutoMovieDialogueVisemeCompilation =>
          joinWith({ line: { ...line(), endFrame: 19.5 } }),
        "invalid range",
      ),
      negativeLineStart: throwsError(
        (): IAutoMovieDialogueVisemeCompilation =>
          joinWith({
            line: { ...line(), startFrame: -1 },
            visemes: [
              { phoneme: "a", viseme: "aa", startSample: 0, endSample: 2_000 },
            ],
          }),
        "invalid range",
      ),
      reversedLine: throwsError(
        (): IAutoMovieDialogueVisemeCompilation =>
          joinWith({ line: { ...line(), endFrame: 10 } }),
        "invalid range",
      ),
      negativeViseme: throwsError(
        (): IAutoMovieDialogueVisemeCompilation =>
          joinWith({
            visemes: [
              { phoneme: "a", viseme: "aa", startSample: -1, endSample: 2_000 },
            ],
          }),
        "outside or overlaps",
      ),
      emptyViseme: throwsError(
        (): IAutoMovieDialogueVisemeCompilation =>
          joinWith({
            visemes: [
              {
                phoneme: "a",
                viseme: "aa",
                startSample: 4_000,
                endSample: 4_000,
              },
            ],
          }),
        "outside or overlaps",
      ),
      beyondLine: throwsError(
        (): IAutoMovieDialogueVisemeCompilation =>
          joinWith({
            visemes: [
              {
                phoneme: "a",
                viseme: "aa",
                startSample: 18_000,
                endSample: 22_000,
              },
            ],
          }),
        "outside or overlaps",
      ),
    },
    {
      fractionalLineStart: true,
      fractionalLineEnd: true,
      negativeLineStart: true,
      reversedLine: true,
      negativeViseme: true,
      emptyViseme: true,
      beyondLine: true,
    },
  );
}
