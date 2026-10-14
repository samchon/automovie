import {
  type IAutoMovieDialogueExpressionLayers, type IAutoMovieDialogueVisemeCompilation,
  joinAutoMovieDialogueVisemes,
  sampleAutoMovieDialogueExpression,
} from "@automovie/engine";
import type {
  IAutoMovieExpression,
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

const visemes: IAutoMovieProductionViseme[] = [
  { phoneme: "a", viseme: "aa", startFrame: 12, endFrame: 15 },
  { phoneme: "i", viseme: "ih", startFrame: 17, endFrame: 19 },
];

/**
 * Supplied emission-frame visemes join explicitly, preserve gaps, and seek without history.
 *
 * Scenarios:
 *
 * 1. A line from frame 10 to 20 bound to one actor, with visemes at 12..15 and
 *    17..19, compiles an available emission-timed join and five ranges that
 *    fill both gaps and the tail with `rest`.
 * 2. Sampling frame 13, then gap frame 16, then frame 13 again returns the same
 *    open mouth both times beside the authored expression object, unchanged.
 * 3. A line without a speaker, a speaker with no binding, and a speaker bound
 *    twice each return their own `not-run` reason.
 * 4. No viseme timing, overlapping visemes, a blank actor, fractional,
 *    negative or reversed line ranges, fractional, empty or overrunning viseme
 *    ranges, an unsupported mouth target, and a negative or fractional sample
 *    frame are each refused.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls joinAutoMovieDialogueVisemes with explicit speaker bindings and supplied timing, then sampleAutoMovieDialogueExpression at active/gap/backward-seek frames. Asserts the complete ordered timeline, separate authored/mouth layers, borrowed authored identity, closed not-run reasons, and malformed timing/target/sample refusals.
 * @evidence contracts/testing.md#independent-expectations Literal line [10,20) and authored visemes [12,15)/[17,19) determine five explicit rest/active ranges. Frame 13 requires aa at intensity one, frame 16 requires neutral at zero, and the authored sad intensity remains 0.75; these expectations do not call the join or sampler to calculate their answers.
 * @evidence contracts/testing.md#distinguishing-cases Active-gap-active seeking distinguishes range selection from retained playback state; absent speaker, absent actor and duplicate bindings retain different reasons. Empty/overlapping/out-of-line/fractional timing, blank actor, unsupported target and invalid sample frame each require the stated Error cause.
 * @evidence contracts/testing.md#execution-ownership Uses local timing/binding/expression records and synchronous pure APIs with existing throwsError and structural numeric comparator, without audio, scene/actor application, clocks, global replacement or a new host. Fixture timing does not authenticate final audio bytes, prove lip synchrony, or certify production pipeline wiring.
 */
export function test_engine_dialogue_viseme_join(): void {
  const compiled: IAutoMovieDialogueVisemeCompilation = joinAutoMovieDialogueVisemes({
    line: line(),
    bindings: [{ speaker: "narrator", actor: "actor" }],
    visemes,
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
        { startFrame: 10, endFrame: 12, viseme: "rest" },
        { startFrame: 12, endFrame: 15, viseme: "aa" },
        { startFrame: 15, endFrame: 17, viseme: "rest" },
        { startFrame: 17, endFrame: 19, viseme: "ih" },
        { startFrame: 19, endFrame: 20, viseme: "rest" },
      ],
    },
  );

  const authored: IAutoMovieExpression = {
    preset: "sad",
    intensity: 0.75,
    blendshapes: null,
  };
  const active: IAutoMovieDialogueExpressionLayers = sampleAutoMovieDialogueExpression({
    timeline: compiled.timeline,
    frame: 13,
    authored,
  });
  const gapAfterSeek: IAutoMovieDialogueExpressionLayers = sampleAutoMovieDialogueExpression({
    timeline: compiled.timeline,
    frame: 16,
    authored,
  });
  const activeAgain: IAutoMovieDialogueExpressionLayers = sampleAutoMovieDialogueExpression({
    timeline: compiled.timeline,
    frame: 13,
    authored,
  });
  TestValidator.predicate("sampling leaves authored expression values unchanged", test12ValuesClose(authored, { preset: "sad", intensity: 0.75, blendshapes: null }));
  TestValidator.predicate(
    "mouth-only sampling preserves authored emotion and arbitrary seek",
    test12ValuesClose(
    {
      active,
      gapAfterSeek,
      activeAgain,
      sameAuthoredObject: active.authored === authored,
    },
    {
      active: { authored, mouth: { preset: "aa", intensity: 1 } },
      gapAfterSeek: { authored, mouth: { preset: "neutral", intensity: 0 } },
      activeAgain: { authored, mouth: { preset: "aa", intensity: 1 } },
      sameAuthoredObject: true,
    },
    ),
  );

  TestValidator.equals(
    "missing and ambiguous speaker facts remain closed not-run outcomes",
    {
      missingSpeaker: joinAutoMovieDialogueVisemes({
        line: line(null),
        bindings: [],
        visemes,
      }).join,
      missingActor: joinAutoMovieDialogueVisemes({
        line: line(),
        bindings: [],
        visemes,
      }).join,
      ambiguous: joinAutoMovieDialogueVisemes({
        line: line(),
        bindings: [
          { speaker: "narrator", actor: "one" },
          { speaker: "narrator", actor: "two" },
        ],
        visemes,
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
        () : IAutoMovieDialogueVisemeCompilation =>
          joinAutoMovieDialogueVisemes({
            line: line(),
            bindings: [{ speaker: "narrator", actor: "actor" }],
            visemes: [],
          }),
        "final-byte viseme timing",
      ),
      overlap: throwsError(
        () : IAutoMovieDialogueVisemeCompilation =>
          joinAutoMovieDialogueVisemes({
            line: line(),
            bindings: [{ speaker: "narrator", actor: "actor" }],
            visemes: [
              { phoneme: "a", viseme: "aa", startFrame: 12, endFrame: 16 },
              { phoneme: "i", viseme: "ih", startFrame: 15, endFrame: 18 },
            ],
          }),
        "overlaps",
      ),
      badFrame: throwsError(
        () : IAutoMovieDialogueExpressionLayers =>
          sampleAutoMovieDialogueExpression({
            timeline: compiled.timeline!,
            frame: -1,
            authored: null,
          }),
        "non-negative integer",
      ),
    },
    { absentTiming: true, overlap: true, badFrame: true },
  );

  const joinWith: (props: { line?: IAutoMovieProductionDialogueLine; visemes?: IAutoMovieProductionViseme[]; actor?: string; }) => IAutoMovieDialogueVisemeCompilation = (props: {
    line?: IAutoMovieProductionDialogueLine;
    visemes?: IAutoMovieProductionViseme[];
    actor?: string;
  }) : IAutoMovieDialogueVisemeCompilation =>
    joinAutoMovieDialogueVisemes({
      line: props.line ?? line(),
      bindings: [
        {
          speaker: "narrator",
          actor: props.actor === undefined ? "actor" : props.actor,
        },
      ],
      visemes: props.visemes ?? visemes,
    });
  TestValidator.equals(
    "every malformed line and viseme boundary is refused at the join",
    {
      blankActor: throwsError(
        () : IAutoMovieDialogueVisemeCompilation => joinWith({ actor: " " }),
        "must not be blank",
      ),
      fractionalLineStart: throwsError(
        () : IAutoMovieDialogueVisemeCompilation => joinWith({ line: { ...line(), startFrame: 10.5 } }),
        "invalid range",
      ),
      fractionalLineEnd: throwsError(
        () : IAutoMovieDialogueVisemeCompilation => joinWith({ line: { ...line(), endFrame: 19.5 } }),
        "invalid range",
      ),
      negativeLineStart: throwsError(
        () : IAutoMovieDialogueVisemeCompilation =>
          joinWith({
            line: { ...line(), startFrame: -1 },
            visemes: [
              { phoneme: "a", viseme: "aa", startFrame: 0, endFrame: 1 },
            ],
          }),
        "invalid range",
      ),
      reversedLine: throwsError(
        () : IAutoMovieDialogueVisemeCompilation => joinWith({ line: { ...line(), endFrame: 10 } }),
        "invalid range",
      ),
      fractionalVisemeStart: throwsError(
        () : IAutoMovieDialogueVisemeCompilation =>
          joinWith({
            visemes: [
              { phoneme: "a", viseme: "aa", startFrame: 10.5, endFrame: 12 },
            ],
          }),
        "outside or overlaps",
      ),
      fractionalVisemeEnd: throwsError(
        () : IAutoMovieDialogueVisemeCompilation =>
          joinWith({
            visemes: [
              { phoneme: "a", viseme: "aa", startFrame: 10, endFrame: 12.5 },
            ],
          }),
        "outside or overlaps",
      ),
      emptyViseme: throwsError(
        () : IAutoMovieDialogueVisemeCompilation =>
          joinWith({
            visemes: [
              { phoneme: "a", viseme: "aa", startFrame: 12, endFrame: 12 },
            ],
          }),
        "outside or overlaps",
      ),
      beyondLine: throwsError(
        () : IAutoMovieDialogueVisemeCompilation =>
          joinWith({
            visemes: [
              { phoneme: "a", viseme: "aa", startFrame: 19, endFrame: 21 },
            ],
          }),
        "outside or overlaps",
      ),
      unsupportedViseme: throwsError(
        () : IAutoMovieDialogueVisemeCompilation =>
          joinWith({
            visemes: [
              {
                phoneme: "x",
                viseme: "bogus" as IAutoMovieProductionViseme["viseme"],
                startFrame: 12,
                endFrame: 13,
              },
            ],
          }),
        "unsupported mouth target",
      ),
      fractionalSample: throwsError(
        () : IAutoMovieDialogueExpressionLayers =>
          sampleAutoMovieDialogueExpression({
            timeline: compiled.timeline!,
            frame: 1.5,
            authored: null,
          }),
        "non-negative integer",
      ),
    },
    {
      blankActor: true,
      fractionalLineStart: true,
      fractionalLineEnd: true,
      negativeLineStart: true,
      reversedLine: true,
      fractionalVisemeStart: true,
      fractionalVisemeEnd: true,
      emptyViseme: true,
      beyondLine: true,
      unsupportedViseme: true,
      fractionalSample: true,
    },
  );
}
