import { IAutoMovieSequence, IAutoMovieShot } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMoviePlaybackEntry } from "../../../../packages/engine/src/film/IAutoMoviePlaybackEntry";
import { IAutoMoviePlaybackEvent } from "../../../../packages/engine/src/film/IAutoMoviePlaybackEvent";
import { IAutoMoviePlaybackSample } from "../../../../packages/engine/src/film/IAutoMoviePlaybackSample";
import { IAutoMoviePlaybackTimeline } from "../../../../packages/engine/src/film/IAutoMoviePlaybackTimeline";
import { resolveSequencePlayback } from "../../../../packages/engine/src/film/resolveSequencePlayback";
import { sequenceEventTimeline } from "../../../../packages/engine/src/film/sequenceEventTimeline";
import { sequenceTimeline } from "../../../../packages/engine/src/film/sequenceTimeline";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Builds an authored empty-motion shot with a supplied id and span; its playback entry owns assertions derived from the stated trims, overlap clocks and boundaries.
 */
function shot(id: string, duration: number): IAutoMovieShot {
  return {
    id,
    name: null,
    scene: "scene-duel",
    camera: "cam-main",
    cameraMotion: null,
    performances: [],
    objectMotions: [],
    duration,
  };
}
const SHOTS: IAutoMovieShot[] = [
  shot("shot:beat-1", 3),
  shot("shot:beat-2", 4),
];
type Event = NonNullable<IAutoMovieShot["events"]>[number];
/**
 * Builds the authored event identity, kind, source and shot clock with absent optional subjects; the owning resolver entry independently determines trim-seam and replay placement.
 */
function event(
  id: string,
  kind: Event["kind"],
  source: Event["source"],
  time: number,
): Event {
  return {
    id,
    kind,
    source,
    time,
    actor: null,
    target: null,
    object: null,
    point: null,
    actionIndex: null,
    reaction: null,
  };
}

const SEQUENCE: IAutoMovieSequence = {
  id: "seq",
  name: null,
  fps: 24,
  shots: [
    { shot: "shot:beat-1", trim: null, transition: null },
    {
      shot: "shot:beat-2",
      trim: { start: 0.5, duration: 2 },
      transition: null,
    },
    {
      shot: "shot:beat-1",
      trim: null,
      transition: { kind: "crossDissolve", duration: 0.5 },
    },
  ],
};

/**
 * Calls source timeline, random-access playback and event placement, asserting independent entry clocks, trim offsets, blend weights, structural refusals and emitted event identities/times; a missing seam event or suppressed replay fails the owning scenario.
 *
 * Scenarios:
 * 1. Derive timeline starts and runtime from authored trims and overlap.
 * 2. Resolve a hard-cut shot and a trimmed local clock.
 * 3. Resolve live/outgoing clocks and blend alpha inside the dissolve, then end the blend.
 * 4. Distinguish the opening from negative, exclusive-end and NaN queries.
 * 5. Refuse duplicate/missing shots, an empty sequence and a first-entry transition.
 * 6. Place trimmed events, order tied ids and return no events without metadata.
 * 7. Emit a contiguous seam once and retain the shot-final event.
 * 8. Retain a hit exactly at a mid-shot cut-away.
 * 9. Emit a replayed hit at each noncontiguous flashback play.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls source timeline, random-access playback and event placement, asserting independent entry clocks, trim offsets, blend weights, structural refusals and emitted event identities/times; a missing seam event or suppressed replay fails the owning scenario.
 * @evidence contracts/testing.md#independent-expectations The authored spans give starts 0, 3 and 4.5 and runtime 7.5 by addition minus overlap; local clocks add trim offset and blend alpha divides elapsed overlap by 0.5. Event expectations follow half-open contiguous ranges, retained cut-away boundaries and distinct global plays, independently of the layout/index helper.
 * @evidence contracts/testing.md#distinguishing-cases Covers hard cuts, trim offsets, inside/after dissolve, opening/exclusive end/nonfinite clocks, duplicate/missing shots, empty cut, first-entry transition, absent events, tied event ids, contiguous seam, cut-away hit and noncontiguous flashback replay; monotone-cursor equivalence belongs to its separate entry.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous unit entry owns its hand-authored shots, events and assertions and imports the portable numerical source functions; it needs no installed consumer, process, browser or GPU.
 */
export function test_film_playback_resolver(): void {
  const timeline: IAutoMoviePlaybackTimeline = sequenceTimeline(
    SEQUENCE,
    SHOTS,
  );
  TestValidator.predicate(
    "entry starts",
    timeline.entries.length === 3 &&
      timeline.entries.every(
        (entry: IAutoMoviePlaybackEntry, index: number): boolean =>
          nclose(entry.start, [0, 3, 4.5][index]!),
      ),
  );
  TestValidator.predicate("runtime", nclose(timeline.runtime, 7.5));

  const at: (t: number) => IAutoMoviePlaybackSample | null = (
    t: number,
  ): IAutoMoviePlaybackSample | null =>
    resolveSequencePlayback(SEQUENCE, SHOTS, t);

  const t1: IAutoMoviePlaybackSample = at(1)!;
  TestValidator.equals("T=1 shot", t1.shot, "shot:beat-1");
  TestValidator.predicate("T=1 local", nclose(t1.time, 1));
  TestValidator.equals("T=1 hard cut", t1.blend, null);

  const t32: IAutoMoviePlaybackSample = at(3.2)!;
  TestValidator.equals("T=3.2 shot", t32.shot, "shot:beat-2");
  TestValidator.predicate("T=3.2 trimmed local", nclose(t32.time, 0.7));
  TestValidator.equals("T=3.2 no blend", t32.blend, null);

  const t47: IAutoMoviePlaybackSample = at(4.7)!;
  TestValidator.equals("T=4.7 live shot", t47.shot, "shot:beat-1");
  TestValidator.predicate("T=4.7 live local", nclose(t47.time, 0.2));
  TestValidator.predicate(
    "T=4.7 outgoing tail",
    t47.blend !== null &&
      t47.blend.shot === "shot:beat-2" &&
      nclose(t47.blend.time, 2.2) &&
      nclose(t47.blend.alpha, 0.4),
  );

  TestValidator.equals("T=5.1 past the dissolve", at(5.1)!.blend, null);

  TestValidator.equals("before the film", at(-1), null);
  TestValidator.equals("at the exclusive end", at(7.5), null);
  TestValidator.equals("at a non-finite instant", at(Number.NaN), null);
  const t0: IAutoMoviePlaybackSample = at(0)!;
  TestValidator.predicate(
    "first frame",
    t0.shot === "shot:beat-1" && nclose(t0.time, 0),
  );
  TestValidator.predicate(
    "duplicate playback shots reject ambiguous lookup",
    throwsError(
      (): IAutoMoviePlaybackTimeline =>
        sequenceTimeline(SEQUENCE, [
          SHOTS[0]!,
          { ...SHOTS[0]!, duration: 9 },
          SHOTS[1]!,
        ]),
      ['shot id "shot:beat-1"', "shots[1].id"],
    ),
  );
  TestValidator.predicate(
    "missing trimmed playback shot rejects bad sequence entry",
    throwsError(
      (): IAutoMoviePlaybackTimeline =>
        sequenceTimeline(
          {
            ...SEQUENCE,
            shots: [
              {
                shot: "shot:missing",
                trim: { start: 0, duration: 1 },
                transition: null,
              },
            ],
          },
          SHOTS,
        ),
      ['sequence shot "shot:missing"', "sequence.shots[0].shot"],
    ),
  );
  TestValidator.predicate(
    "empty playback sequence rejects before sampling",
    throwsError(
      (): IAutoMoviePlaybackTimeline =>
        sequenceTimeline({ ...SEQUENCE, shots: [] }, SHOTS),
      ['sequence "seq"', "at least one shot"],
    ),
  );
  TestValidator.predicate(
    "first playback transition rejects missing outgoing entry",
    throwsError(
      (): IAutoMoviePlaybackSample | null =>
        resolveSequencePlayback(
          {
            ...SEQUENCE,
            shots: [
              {
                shot: "shot:beat-1",
                trim: null,
                transition: { kind: "crossDissolve", duration: 0.5 },
              },
            ],
          },
          SHOTS,
          0,
        ),
      ["sequence.shots[0].transition", "nothing to transition from"],
    ),
  );
  const eventShots: IAutoMovieShot[] = [
    {
      ...shot("shot:beat-1", 3),
      events: [
        event("a-before", "contact", "sampledProximity", 0.5),
        event("a-in", "hit", "impactOutput", 1.25),
        event("a-z", "contact", "sampledProximity", 1.25),
        event("a-after", "fall", "impactOutput", 2.75),
      ],
    },
    {
      ...shot("shot:beat-2", 4),
      events: [
        event("b-in", "attach", "scriptedCue", 1),
        event("b-after", "release", "scriptedCue", 3),
      ],
    },
  ];
  const eventSequence: IAutoMovieSequence = {
    id: "seq-events",
    name: null,
    fps: 24,
    shots: [
      {
        shot: "shot:beat-1",
        trim: { start: 1, duration: 1.5 },
        transition: null,
      },
      {
        shot: "shot:beat-2",
        trim: { start: 0.5, duration: 2 },
        transition: { kind: "crossDissolve", duration: 0.25 },
      },
    ],
  };
  const events: IAutoMoviePlaybackEvent[] = sequenceEventTimeline(
    eventSequence,
    eventShots,
  );
  TestValidator.equals(
    "sequence events keep only events inside trims",
    events.map((e: IAutoMoviePlaybackEvent): string => e.id),
    ["a-in", "a-z", "b-in"],
  );
  TestValidator.predicate(
    "shot-local events are placed on the global clock",
    nclose(events[0]!.shotTime, 1.25) &&
      nclose(events[0]!.globalTime, 0.25) &&
      events[0]!.entry === 0 &&
      events[0]!.shot === "shot:beat-1" &&
      nclose(events[1]!.shotTime, 1.25) &&
      nclose(events[1]!.globalTime, 0.25) &&
      events[1]!.entry === 0 &&
      events[1]!.shot === "shot:beat-1" &&
      nclose(events[2]!.shotTime, 1) &&
      nclose(events[2]!.globalTime, 1.75) &&
      events[2]!.entry === 1 &&
      events[2]!.shot === "shot:beat-2",
  );
  TestValidator.equals(
    "shots without interaction metadata produce no sequence events",
    sequenceEventTimeline(SEQUENCE, SHOTS),
    [],
  );

  // 7. a contiguous trim seam emits the seam event once; the shot end survives
  const seamShots: IAutoMovieShot[] = [
    {
      ...shot("shot:beat-1", 2),
      events: [
        event("seam", "contact", "sampledProximity", 1),
        event("final", "release", "scriptedCue", 2),
      ],
    },
  ];
  const seamEvents: IAutoMoviePlaybackEvent[] = sequenceEventTimeline(
    {
      id: "seq-seam",
      name: null,
      fps: 24,
      shots: [
        {
          shot: "shot:beat-1",
          trim: { start: 0, duration: 1 },
          transition: null,
        },
        {
          shot: "shot:beat-1",
          trim: { start: 1, duration: 1 },
          transition: null,
        },
      ],
    },
    seamShots,
  );
  TestValidator.equals(
    "a seam event emits once and the shot-final event survives",
    seamEvents.map((e: IAutoMoviePlaybackEvent): (string | number)[] => [
      e.id,
      e.entry,
    ]),
    [
      ["seam", 1],
      ["final", 1],
    ],
  );

  // 8. a hit exactly on a mid-shot cut-away survives at the cut (#1061)
  const cutShots: IAutoMovieShot[] = [
    {
      ...shot("shot:beat-1", 4),
      events: [event("hit", "contact", "sampledProximity", 2)],
    },
    shot("shot:beat-2", 1),
  ];
  const cutEvents: IAutoMoviePlaybackEvent[] = sequenceEventTimeline(
    {
      id: "seq-cut",
      name: null,
      fps: 24,
      shots: [
        {
          shot: "shot:beat-1",
          trim: { start: 0, duration: 2 },
          transition: null,
        },
        { shot: "shot:beat-2", trim: null, transition: null },
      ],
    },
    cutShots,
  );
  TestValidator.predicate(
    "a hit exactly on a mid-shot cut-away survives at the cut",
    cutEvents.length === 1 &&
      cutEvents[0]!.id === "hit" &&
      cutEvents[0]!.entry === 0 &&
      nclose(cutEvents[0]!.globalTime, 2),
  );

  // 9. a flashback's cut keeps its own hit: shot-local coincidence with a
  // non-contiguous entry owns nothing (#1099)
  const flashbackShots: IAutoMovieShot[] = [
    {
      ...shot("shot:beat-1", 4),
      events: [event("hit", "contact", "sampledProximity", 2)],
    },
  ];
  const flashbackEvents: IAutoMoviePlaybackEvent[] = sequenceEventTimeline(
    {
      id: "seq-flashback",
      name: null,
      fps: 24,
      shots: [
        {
          shot: "shot:beat-1",
          trim: { start: 2, duration: 2 },
          transition: null,
        },
        {
          shot: "shot:beat-1",
          trim: { start: 0, duration: 2 },
          transition: null,
        },
      ],
    },
    flashbackShots,
  );
  TestValidator.predicate(
    "a flashback's cut emits the hit at its own global time (per play)",
    flashbackEvents.length === 2 &&
      flashbackEvents.every(
        (event: IAutoMoviePlaybackEvent, index: number): boolean =>
          event.id === "hit" &&
          event.entry === index &&
          nclose(event.globalTime, index === 0 ? 0 : 4),
      ),
  );
}
