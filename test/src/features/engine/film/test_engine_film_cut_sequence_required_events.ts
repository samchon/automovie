import { AutoMovieEngineFilm } from "@automovie/engine";
import type {
  IAutoMovieCut,
  IAutoMovieEditPlan,
  IAutoMovieInteractionEvent,
  IAutoMoviePlaybackEvent,
  IAutoMovieShot,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";

/**
 * An edit requirement addresses one play of a shot and requires an unambiguous
 * event retained there.
 *
 * Scenarios:
 *
 * 1. The first of two contiguous trims loses a handoff at 1.5 seconds and cannot
 *    borrow it from the second.
 * 2. The second trim retains the handoff at 1.5 output seconds and passes.
 * 3. Two retained events with the required id in one play are ambiguous and fail.
 */
export function test_engine_film_cut_sequence_required_events(): void {
  const handoff: IAutoMovieInteractionEvent = {
    id: "cup-handoff",
    kind: "attach",
    source: "scriptedCue",
    time: 1.5,
    actor: "performer",
    target: "performer",
    object: "cup",
    point: null,
    actionIndex: 0,
    reaction: null,
  };
  const shot: IAutoMovieShot = {
    id: "handoff",
    name: null,
    scene: "table",
    camera: "main",
    cameraMotion: null,
    performances: [],
    objectMotions: [],
    duration: 2,
    events: [handoff],
  };
  const plan: IAutoMovieEditPlan = {
    sequence: { id: "table-scene", name: "At the table" },
    fps: 24,
    entries: [
      { shot: shot.id, trim: { start: 0, duration: 1 }, transition: null },
      { shot: shot.id, trim: { start: 1, duration: 1 }, transition: null },
    ],
    pacing: "Hold through the handoff.",
    continuity: "Keep both sides of the handoff in order.",
  };

  const needed: IAutoMovieEditPlan = {
    ...plan,
    requiredEvents: [{ entry: 1, event: handoff.id }],
  };
  const kept: IAutoMovieCut = AutoMovieEngineFilm.cutSequence(needed, [shot]);
  if (!kept.success) throw new Error("the second play must retain the handoff");
  const events: IAutoMoviePlaybackEvent[] = AutoMovieEngineFilm.sequenceEventTimeline(
    kept.sequence,
    [shot],
  );
  TestValidator.equals(
    "only the incoming play retains the source event",
    events.map((event: IAutoMoviePlaybackEvent): [string, number] => [
      event.id,
      event.entry,
    ]),
    [[handoff.id, 1]],
  );
  TestValidator.predicate(
    "handoff output time",
    nclose(events[0]!.globalTime, 1.5),
  );

  const refusals: readonly [
    string,
    IAutoMovieEditPlan,
    IAutoMovieShot,
    string[],
  ][] = [
    [
      "the first play cannot borrow the handoff",
      { ...needed, requiredEvents: [{ entry: 0, event: handoff.id }] },
      shot,
      ["$input.requiredEvents[0].event"],
    ],
    [
      "two retained events are ambiguous",
      needed,
      { ...shot, events: [handoff, { ...handoff, time: 1.75 }] },
      ["$input.requiredEvents[0].event"],
    ],
  ];
  for (const [label, candidate, source, paths] of refusals) {
    const result: IAutoMovieCut = AutoMovieEngineFilm.cutSequence(candidate, [source]);
    TestValidator.equals(
      label,
      result.success ? [] : result.violations.map((item): string => item.path),
      paths,
    );
  }
}
