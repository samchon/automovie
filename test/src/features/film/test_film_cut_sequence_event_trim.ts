import { cutSequence, sequenceEventTimeline } from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieCut,
  IAutoMovieEditPlan,
  IAutoMovieInteractionEvent,
  IAutoMoviePlaybackEvent,
  IAutoMovieShot,
  IAutoMovieTrim,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * Symbolic trim bounds become ordinary source spans before timeline projection.
 *
 * Scenarios:
 *
 * 1. Two contiguous retimed plays share an event anchor, which appears once on the second play.
 * 2. Absent and duplicated ids in the same trim report both bound paths.
 * 3. A blank id and a non-finite time are refused at their own bound paths.
 * 4. Reversing the bounds or selecting the same time refuses the span.
 * 5. Raw null and array bounds, invalid bound fields, and two trim forms are refused.
 * 6. A full-shot end that rounds outward retains its exact event after inward
 *    lowering, even for a rate that makes the source tolerance smaller than one ULP.
 * 7. Distinct events just outside the selected anchors at 1 and 2 seconds
 *    are absent from the exact one-second output and cannot satisfy requirements.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public edit gate and event projection and checks normalized trims, runtime, seam ownership and refusal paths.
 * @evidence contracts/development/testing.md#independent-expectations Start, seam and end are at 0.5, 1.5 and 3.5 source seconds. Each played duration is divided by two, so the film spans 1.5 seconds and the seam belongs to the second play at 0.5 output seconds.
 * @evidence contracts/development/testing.md#distinguishing-cases Uses unique, missing, repeated and blank ids, a non-finite time, malformed bounds, a numeric/symbolic conflict, and both descending and equal times. A valid symbolic end whose arithmetic overshoots is compared with the corresponding refused numeric trim.
 * @evidence contracts/development/testing.md#execution-ownership The synchronous, discoverable spec checks supplied built shot facts through the engine without a renderer or authoring host.
 * @evidence contracts/development/common.md#meaningful-documentation Names the admitted edit, exact source and output times, seam ownership and independent refused conditions.
 */
export function test_film_cut_sequence_event_trim(): void {
  const start: IAutoMovieInteractionEvent = {
    id: "start",
    kind: "attach",
    source: "scriptedCue",
    time: 0.5,
    actor: "performer",
    target: "performer",
    object: "cup",
    point: null,
    actionIndex: 0,
    reaction: null,
  };
  const seam: IAutoMovieInteractionEvent = { ...start, id: "seam", time: 1.5 };
  const end: IAutoMovieInteractionEvent = { ...start, id: "end", time: 3.5 };
  const shot: IAutoMovieShot = {
    id: "handoff",
    name: null,
    scene: "table",
    camera: "main",
    cameraMotion: null,
    performances: [],
    objectMotions: [],
    duration: 4,
    events: [start, seam, end],
  };
  const plan: IAutoMovieEditPlan = {
    sequence: { id: "table-scene", name: "At the table" },
    fps: 24,
    entries: [
      {
        shot: shot.id,
        trim: null,
        trimByEvents: { startEvent: start.id, endEvent: seam.id },
        playbackRate: 2,
        transition: null,
      },
      {
        shot: shot.id,
        trim: null,
        trimByEvents: { startEvent: seam.id, endEvent: end.id },
        playbackRate: 2,
        transition: null,
      },
    ],
    requiredEvents: [{ entry: 1, event: seam.id }],
    pacing: "Move through the handoff.",
    continuity: "Meet at the handoff.",
  };
  const cut: IAutoMovieCut = cutSequence(plan, [shot]);
  TestValidator.equals("event trims succeed", cut.success, true);
  if (cut.success) {
    TestValidator.predicate("retimed runtime", nclose(cut.runtime, 1.5));
    TestValidator.predicate(
      "first symbolic trim becomes its numeric source span",
      nclose(cut.sequence.shots[0]!.trim!.start, 0.5) &&
        nclose(cut.sequence.shots[0]!.trim!.duration, 1),
    );
    TestValidator.predicate(
      "second symbolic trim becomes its numeric source span",
      nclose(cut.sequence.shots[1]!.trim!.start, 1.5) &&
        nclose(cut.sequence.shots[1]!.trim!.duration, 2),
    );
    TestValidator.equals(
      "no symbolic field survives normalization",
      cut.sequence.shots.some((entry): boolean => "trimByEvents" in entry),
      false,
    );
    const seamPlays: IAutoMoviePlaybackEvent[] = sequenceEventTimeline(
      cut.sequence,
      [shot],
    ).filter((event: IAutoMoviePlaybackEvent): boolean => event.id === seam.id);
    TestValidator.equals(
      "seam belongs only to the incoming play",
      seamPlays.map((event: IAutoMoviePlaybackEvent): number => event.entry),
      [1],
    );
    TestValidator.predicate(
      "retimed seam time",
      nclose(seamPlays[0]!.globalTime, 0.5),
    );
  }

  /** Return diagnostics for one placement so a second play cannot supply a missing bound. */
  function paths(
    trimByEvents: unknown,
    events: IAutoMovieInteractionEvent[],
    trim: IAutoMovieTrim | null = null,
  ): string[] {
    const result: IAutoMovieCut = cutSequence(
      {
        ...plan,
        requiredEvents: [],
        entries: [
          {
            shot: shot.id,
            trim,
            trimByEvents,
            transition: null,
          } as IAutoMovieEditPlan["entries"][number],
        ],
      },
      [{ ...shot, events }],
    );
    return result.success
      ? []
      : result.violations.map(
          (item: IAutoMovieConstraintViolation): string => item.path,
        );
  }

  TestValidator.equals(
    "missing and ambiguous id paths",
    paths({ startEvent: "missing", endEvent: end.id }, [
      start,
      end,
      { ...end, time: 3 },
    ]),
    [
      "$input.entries[0].trimByEvents.startEvent",
      "$input.entries[0].trimByEvents.endEvent",
    ],
  );
  TestValidator.equals(
    "blank id and invalid time paths",
    paths({ startEvent: " ", endEvent: end.id }, [
      { ...end, time: Number.NaN },
    ]),
    [
      "$input.entries[0].trimByEvents.startEvent",
      "$input.entries[0].trimByEvents.endEvent",
    ],
  );
  TestValidator.equals(
    "reversed bounds path",
    paths({ startEvent: end.id, endEvent: start.id }, [start, end]),
    ["$input.entries[0].trimByEvents"],
  );
  TestValidator.equals(
    "equal bounds path",
    paths({ startEvent: start.id, endEvent: start.id }, [start]),
    ["$input.entries[0].trimByEvents"],
  );

  TestValidator.equals("null trim bounds", paths(null, []), [
    "$input.entries[0].trimByEvents",
  ]);
  TestValidator.equals("array trim bounds", paths([], []), [
    "$input.entries[0].trimByEvents",
  ]);
  TestValidator.equals(
    "missing and non-string fields",
    paths({ endEvent: 7 }, []),
    [
      "$input.entries[0].trimByEvents.startEvent",
      "$input.entries[0].trimByEvents.endEvent",
    ],
  );
  TestValidator.equals(
    "numeric and symbolic trim conflict",
    paths({ startEvent: start.id, endEvent: end.id }, [start, end], {
      start: 0,
      duration: 1,
    }),
    ["$input.entries[0].trimByEvents"],
  );

  const short: IAutoMovieShot = {
    ...shot,
    duration: 0.009,
    events: [
      { ...start, time: 0.001 },
      { ...end, time: 0.009 },
    ],
  };
  const boundary: IAutoMovieCut = cutSequence(
    {
      ...plan,
      requiredEvents: [{ entry: 0, event: end.id }],
      entries: [
        {
          shot: short.id,
          trim: null,
          trimByEvents: { startEvent: start.id, endEvent: end.id },
          playbackRate: 1e-10,
          transition: null,
        },
      ],
    },
    [short],
  );
  TestValidator.equals("symbolic shot end is retained", boundary.success, true);
  if (boundary.success) {
    const lowered: IAutoMovieTrim = boundary.sequence.shots[0]!.trim!;
    TestValidator.predicate(
      "lowered duration is the binary64 predecessor of 0.008",
      lowered.duration === 0.007999999999999998 &&
        lowered.start + lowered.duration < short.duration,
    );
    TestValidator.predicate(
      "exact source end retains the selected event at the output end",
      boundary.sequence.shots[0]!.exactSourceEnd === short.duration &&
        sequenceEventTimeline(boundary.sequence, [short]).some(
          (event: IAutoMoviePlaybackEvent): boolean =>
            event.id === end.id && event.globalTime === boundary.runtime,
        ),
    );
  }

  const numeric: IAutoMovieCut = cutSequence(
    {
      ...plan,
      requiredEvents: [],
      entries: [
        {
          shot: short.id,
          trim: { start: 0.001, duration: 0.008 },
          transition: null,
        },
      ],
    },
    [short],
  );
  TestValidator.equals(
    "out-of-range numeric trim is refused",
    numeric.success,
    false,
  );
  if (numeric.success === false)
    TestValidator.equals(
      "numeric trim keeps its existing violation path",
      numeric.violations.map(
        (item: IAutoMovieConstraintViolation): string => item.path,
      ),
      ["$input.entries[0].trim"],
    );

  const before: IAutoMovieInteractionEvent = {
    ...start,
    id: "before-start",
    time: 0.9999999995,
  };
  const after: IAutoMovieInteractionEvent = {
    ...end,
    id: "after-end",
    time: 2.0000000005,
  };
  const exactShot: IAutoMovieShot = {
    ...shot,
    events: [before, { ...start, time: 1 }, seam, { ...end, time: 2 }, after],
  };
  const exactPlan: IAutoMovieEditPlan = {
    ...plan,
    entries: [
      {
        shot: exactShot.id,
        trim: null,
        trimByEvents: { startEvent: start.id, endEvent: end.id },
        transition: null,
      },
    ],
    requiredEvents: [],
  };
  const exactCut: IAutoMovieCut = cutSequence(exactPlan, [exactShot]);
  TestValidator.equals("exact source cut succeeds", exactCut.success, true);
  if (exactCut.success)
    TestValidator.equals(
      "only events inside the selected bounds are placed",
      sequenceEventTimeline(exactCut.sequence, [exactShot]).map((event) => ({
        id: event.id,
        time: event.globalTime,
      })),
      [
        { id: start.id, time: 0 },
        { id: seam.id, time: 0.5 },
        { id: end.id, time: 1 },
      ],
    );
  const excluded: IAutoMovieCut = cutSequence(
    {
      ...exactPlan,
      requiredEvents: [before, after].map(({ id }) => ({
        entry: 0,
        event: id,
      })),
    },
    [exactShot],
  );
  TestValidator.equals(
    "both excluded requirements fail",
    excluded.success,
    false,
  );
  if (excluded.success === false)
    TestValidator.equals(
      "each excluded event reports its requirement path",
      excluded.violations.map((item) => item.path),
      ["$input.requiredEvents[0].event", "$input.requiredEvents[1].event"],
    );
}
