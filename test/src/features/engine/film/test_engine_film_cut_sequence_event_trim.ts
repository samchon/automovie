import { AutoMovieEngineFilm } from "@automovie/engine";
import {
  type IAutoMovieConstraintViolation,
  type IAutoMovieCut,
  type IAutoMovieEditPlan,
  type IAutoMovieInteractionEvent,
  type IAutoMoviePlaybackEvent,
  type IAutoMovieSequenceEntry,
  type IAutoMovieShot,
  type IAutoMovieTrim,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";

/**
 * Symbolic trim bounds become ordinary source spans before timeline projection.
 *
 * Scenarios:
 *
 * 1. Two contiguous retimed plays share an event anchor, which appears once on the
 *    second play.
 * 2. Absent and duplicated ids in the same trim report both bound paths.
 * 3. Reversing the bounds or selecting the same time refuses the span.
 * 4. Two trim forms are refused.
 * 5. A full-shot end that rounds outward retains its exact event after inward
 *    lowering, even for a rate that makes the source tolerance smaller than one
 *    ULP.
 * 6. Distinct events just outside the selected anchors at 1 and 2 seconds are
 *    absent from the exact one-second output and cannot satisfy requirements.
 * 7. At 2×, the same numeric span retains those events in half the output time.
 * 8. Precise hard cuts assign nearby events once when the two entries use
 *    different rates or only one side uses event bounds. A deliberately
 *    authored source gap keeps both its adjacent events in their own plays.
 * 9. A numeric sum that rounds past the next trim's 0.3-second source start
 *    partitions at 0.3 when the incoming play is retimed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios name symbolic event bounds, duplicate or missing identities, improper spans, conflicting trim forms and boundary cases on original and retimed clocks.
 * @evidence contracts/development/testing.md#behavioral-verification The test cuts the supplied shots using symbolic and numeric trims, then projects realized event times through the returned cut. It checks findings by bound path and compares immediately adjacent source events through rate changes and handoff cuts.
 * @evidence contracts/development/testing.md#independent-expectations Authored source timestamps determine the boundary and rate determines output duration, so the shared anchor belongs once to the incoming play. An adjacent representable event outside an exact trim remains outside. A deliberate source gap owns each of its bounding events separately.
 */
export function test_engine_film_cut_sequence_event_trim(): void {
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
  const cut: IAutoMovieCut = AutoMovieEngineFilm.cutSequence(plan, [shot]);
  if (!cut.success) throw new Error("both symbolic trims must be admitted");
  TestValidator.predicate("retimed runtime", nclose(cut.runtime, 1.5));
  // The whole entry is compared, so a symbolic `trimByEvents` left on the
  // normalized entry is a difference; every bound is an exact binary fraction.
  const normalized: IAutoMovieSequenceEntry[] = cut.sequence.shots;
  const expected: IAutoMovieSequenceEntry[] = [
    {
      shot: shot.id,
      trim: { start: 0.5, duration: 1 },
      exactSourceEnd: 1.5,
      transition: null,
      playbackRate: 2,
    },
    {
      shot: shot.id,
      trim: { start: 1.5, duration: 2 },
      exactSourceEnd: 3.5,
      transition: null,
      playbackRate: 2,
    },
  ];
  TestValidator.equals(
    "symbolic bounds become the two source spans",
    normalized,
    expected,
  );
  const seamPlays: IAutoMoviePlaybackEvent[] =
    AutoMovieEngineFilm.sequenceEventTimeline(cut.sequence, [shot]).filter(
      (event): boolean => event.id === seam.id,
    );
  TestValidator.predicate(
    "the incoming play alone owns the seam at output 0.5",
    seamPlays.length === 1 &&
      seamPlays[0]?.entry === 1 &&
      nclose(seamPlays[0].globalTime, 0.5),
  );

  /**
   * Return diagnostics for one placement so a second play cannot supply a
   * missing bound.
   */
  function paths(
    trimByEvents: IAutoMovieEditPlan["entries"][number]["trimByEvents"],
    events: IAutoMovieInteractionEvent[],
    trim: IAutoMovieTrim | null = null,
  ): string[] {
    const result: IAutoMovieCut = AutoMovieEngineFilm.cutSequence(
      {
        ...plan,
        requiredEvents: [],
        entries: [
          {
            shot: shot.id,
            trim,
            trimByEvents,
            transition: null,
          },
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

  const bound: string = "$input.entries[0].trimByEvents";
  const fields: string[] = [bound + ".startEvent", bound + ".endEvent"];
  TestValidator.equals(
    "missing and ambiguous ids",
    paths({ startEvent: "missing", endEvent: end.id }, [
      start,
      end,
      { ...end, time: 3 },
    ]),
    fields,
  );

  const malformed: readonly [
    string,
    NonNullable<IAutoMovieEditPlan["entries"][number]["trimByEvents"]>,
  ][] = [
    ["descending span", { startEvent: end.id, endEvent: start.id }],
    ["equal bounds", { startEvent: start.id, endEvent: start.id }],
  ];
  for (const [label, bounds] of malformed)
    TestValidator.equals(label, paths(bounds, [start, end]), [bound]);
  TestValidator.equals(
    "numeric and symbolic trim conflict",
    paths({ startEvent: start.id, endEvent: end.id }, [start, end], {
      start: 0,
      duration: 1,
    }),
    [bound],
  );

  const short: IAutoMovieShot = {
    ...shot,
    duration: 0.009,
    events: [
      { ...start, time: 0.001 },
      { ...end, time: 0.009 },
    ],
  };
  const boundary: IAutoMovieCut = AutoMovieEngineFilm.cutSequence(
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
  if (!boundary.success)
    throw new Error("the exact symbolic end must be retained");
  const lowered: IAutoMovieTrim = boundary.sequence.shots[0]!.trim!;
  TestValidator.predicate(
    "lowered duration is the binary64 predecessor of 0.008",
    lowered.duration === 0.007999999999999998 &&
      lowered.start + lowered.duration < short.duration,
  );
  TestValidator.predicate(
    "the selected end maps exactly to the output end",
    boundary.sequence.shots[0]!.exactSourceEnd === short.duration &&
      AutoMovieEngineFilm.sequenceEventTimeline(boundary.sequence, [
        short,
      ]).some(
        (event): boolean =>
          event.id === end.id && event.globalTime === boundary.runtime,
      ),
  );

  const numeric: IAutoMovieCut = AutoMovieEngineFilm.cutSequence(
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
    "numeric overshoot keeps its existing violation path",
    numeric.success ? [] : numeric.violations.map((item): string => item.path),
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
  /** One authored placement may use numeric or symbolic source bounds. */
  type AutoMovieEditEntry = IAutoMovieEditPlan["entries"][number];
  const exactCases: readonly [string, AutoMovieEditEntry, number][] = [
    ["symbolic", exactPlan.entries[0]!, 1],
    [
      "numeric at 2×",
      {
        shot: shot.id,
        trim: { start: 1, duration: 1 },
        playbackRate: 2,
        transition: null,
      },
      2,
    ],
  ];
  for (const [label, entry, rate] of exactCases) {
    const result: IAutoMovieCut = AutoMovieEngineFilm.cutSequence(
      { ...exactPlan, entries: [entry] },
      [exactShot],
    );
    if (!result.success) throw new Error(label + " span must be admitted");
    const events: IAutoMoviePlaybackEvent[] =
      AutoMovieEngineFilm.sequenceEventTimeline(result.sequence, [exactShot]);
    TestValidator.equals(
      label + " keeps only the three inside events",
      events.map((event): string => event.id),
      [start.id, seam.id, end.id],
    );
    TestValidator.predicate(
      label + " maps source elapsed time through the rate",
      events[0]?.globalTime === 0 &&
        events[1]?.globalTime === 0.5 / rate &&
        events[2]?.globalTime === 1 / rate,
    );
  }
  const excluded: IAutoMovieCut = AutoMovieEngineFilm.cutSequence(
    {
      ...exactPlan,
      requiredEvents: [before, after].map(
        ({ id }): { entry: number; event: string } => ({ entry: 0, event: id }),
      ),
    },
    [exactShot],
  );
  TestValidator.equals(
    "each excluded event reports its requirement path",
    excluded.success
      ? []
      : excluded.violations.map((item): string => item.path),
    ["$input.requiredEvents[0].event", "$input.requiredEvents[1].event"],
  );

  const seamShot: IAutoMovieShot = {
    ...shot,
    events: [
      { ...start, time: 0 },
      before,
      { ...seam, time: 1 },
      { ...after, time: 1.0000000005 },
      { ...end, time: 2 },
    ],
  };
  const left: AutoMovieEditEntry = {
    shot: seamShot.id,
    trim: { start: 0, duration: 1 },
    transition: null,
  };
  const right: AutoMovieEditEntry = {
    ...left,
    trim: { start: 1, duration: 1 },
  };
  const symbolicLeft: AutoMovieEditEntry = {
    ...left,
    trim: null,
    trimByEvents: { startEvent: start.id, endEvent: seam.id },
  };
  const symbolicRight: AutoMovieEditEntry = {
    ...right,
    trim: null,
    trimByEvents: { startEvent: seam.id, endEvent: end.id },
  };
  const plays: readonly [
    string,
    AutoMovieEditEntry,
    AutoMovieEditEntry,
    number,
  ][] = [
    [
      "faster before",
      { ...left, playbackRate: 2 },
      { ...right, playbackRate: 0.001 },
      1,
    ],
    ["slower before", { ...left, playbackRate: 0.001 }, right, 1],
    ["event bounds before", symbolicLeft, right, 1],
    ["event bounds after", left, symbolicRight, 1],
    [
      "source gap before numeric play",
      symbolicLeft,
      { ...right, trim: { start: 1.0000000005, duration: 0.9999999995 } },
      0,
    ],
    [
      "source gap before event-bounded play",
      left,
      {
        ...symbolicRight,
        trimByEvents: { startEvent: after.id, endEvent: end.id },
      },
      0,
    ],
  ];
  for (const [label, outgoing, incoming, boundaryEntry] of plays) {
    const result: IAutoMovieCut = AutoMovieEngineFilm.cutSequence(
      {
        ...exactPlan,
        entries: [outgoing, incoming],
        requiredEvents: [{ entry: boundaryEntry, event: seam.id }],
      },
      [seamShot],
    );
    if (!result.success) throw new Error(label + " must be admitted");
    const events: IAutoMoviePlaybackEvent[] =
      AutoMovieEngineFilm.sequenceEventTimeline(result.sequence, [seamShot]);
    TestValidator.equals(
      label + " partitions the events at the source seam",
      events.map((event): [string, number] => [event.id, event.entry]),
      [
        [start.id, 0],
        [before.id, 0],
        [seam.id, boundaryEntry],
        [after.id, 1],
        [end.id, 1],
      ],
    );
    TestValidator.predicate(
      label + " maps the source second 1 to the end of the first play",
      nclose(events[2]?.globalTime ?? NaN, 1 / (outgoing.playbackRate ?? 1)),
    );
  }

  const decimalShot: IAutoMovieShot = {
    ...shot,
    events: [
      { ...before, time: 0.29999999999999993 },
      { ...seam, time: 0.3 },
      { ...after, time: 0.30000000000000004 },
    ],
  };
  const decimal: IAutoMovieCut = AutoMovieEngineFilm.cutSequence(
    {
      ...exactPlan,
      entries: [
        { ...left, trim: { start: 0.1, duration: 0.2 } },
        { ...right, trim: { start: 0.3, duration: 0.3 }, playbackRate: 2 },
      ],
    },
    [decimalShot],
  );
  if (!decimal.success)
    throw new Error("the decimal hard cut must be admitted");
  TestValidator.equals(
    "decimal boundary uses the incoming source time",
    AutoMovieEngineFilm.sequenceEventTimeline(decimal.sequence, [
      decimalShot,
    ]).map((event): [string, number] => [event.id, event.entry]),
    [
      [before.id, 0],
      [seam.id, 1],
      [after.id, 1],
    ],
  );
}
