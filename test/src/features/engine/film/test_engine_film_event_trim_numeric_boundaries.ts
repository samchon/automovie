import { AutoMovieEngineFilm } from "@automovie/engine";
import {
  type IAutoMovieCut,
  type IAutoMovieEditPlan,
  type IAutoMovieInteractionEvent,
  type IAutoMoviePlaybackEvent,
  type IAutoMovieShot,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Retimed numeric boundaries follow the admitted binary64 source span.
 *
 * Scenarios:
 *
 * 1. The exact sum represented by 0.7 + 0.1 rounds below 0.8. Keep the event at
 *    the reconstructed end, excluding the distinct 0.8 event.
 * 2. A source duration of 1e-17 follows source second 1 and plays for one output
 *    second at rate 1e-17. The source start event belongs to output second zero
 *    even though the numeric end rounds to that same source time.
 */
export function test_engine_film_event_trim_numeric_boundaries(): void {
  const anchor: IAutoMovieInteractionEvent = {
    id: "anchor",
    kind: "attach",
    source: "scriptedCue",
    time: 0.7999999999999999,
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
    events: [anchor, { ...anchor, id: "next-instant", time: 0.8 }],
  };
  const plan: IAutoMovieEditPlan = {
    sequence: { id: "table-scene", name: "At the table" },
    fps: 24,
    entries: [
      {
        shot: shot.id,
        trim: { start: 0.7, duration: 0.1 },
        playbackRate: 2,
        transition: null,
      },
    ],
    requiredEvents: [{ entry: 0, event: anchor.id }],
    pacing: "Retain the handoff.",
    continuity: "Cut between setup and release.",
  };
  const decimal: IAutoMovieCut = AutoMovieEngineFilm.cutSequence(plan, [shot]);
  if (!decimal.success) throw new Error("the decimal span must be admitted");
  expectEvent("rounded numeric end", decimal, shot, 0.05);

  const tiny: IAutoMovieShot = { ...shot, events: [{ ...anchor, time: 1 }] };
  const collapsed: IAutoMovieCut = AutoMovieEngineFilm.cutSequence(
    {
      ...plan,
      entries: [
        {
          ...plan.entries[0]!,
          trim: { start: 1, duration: 1e-17 },
          playbackRate: 1e-17,
        },
      ],
    },
    [tiny],
  );
  if (!collapsed.success) throw new Error("the tiny source span must play");
  TestValidator.predicate("retimed output duration", collapsed.runtime === 1);
  expectEvent("opening event in the collapsed source span", collapsed, tiny, 0);

  /**
   * A single retained event must map exactly to its endpoint on the output
   * clock.
   */
  function expectEvent(
    label: string,
    result: IAutoMovieCut.ISuccess,
    source: IAutoMovieShot,
    time: number,
  ): void {
    const events: IAutoMoviePlaybackEvent[] =
      AutoMovieEngineFilm.sequenceEventTimeline(result.sequence, [source]);
    TestValidator.predicate(
      label,
      events.length === 1 &&
        events[0]?.id === anchor.id &&
        events[0].globalTime === time,
    );
  }
}
