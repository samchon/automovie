import { cutSequence, sequenceEventTimeline } from "@automovie/engine";
import type {
  IAutoMovieEditPlan,
  IAutoMovieInteractionEvent,
  IAutoMoviePlaybackEvent,
  IAutoMovieShot,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Retimed numeric boundaries follow the admitted binary64 source span.
 *
 * Scenarios:
 * 1. The exact sum represented by 0.7 + 0.1 rounds below 0.8. Keep the
 *    event at the reconstructed end, excluding the distinct 0.8 event.
 * 2. A source duration of 1e-17 follows source second 1 and plays for one
 *    output second at rate 1e-17. The source start event belongs to output
 *    second zero even though the numeric end rounds to that same source time.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives both input source spans and the retained boundaries.
 * @evidence contracts/development/testing.md#behavioral-verification Exercises admitted edit plans and event placement through the public engine.
 * @evidence contracts/development/testing.md#independent-expectations The lower end in the first case is 0.7999999999999999 and the output duration is 0.05 seconds. In the second case 1e-17 divided by itself gives one output second while the opening event has zero elapsed source time.
 * @evidence contracts/development/testing.md#distinguishing-cases Distinguishes a distinct representable event one step after the retained boundary and an opening event whose source timestamp is also the rounded end.
 * @evidence contracts/development/testing.md#execution-ownership Uses two local cut plans and plain shot event records without building poses or a renderer.
 */
export function test_film_event_trim_numeric_boundaries(): void {
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
  const decimal = cutSequence(plan, [shot]);
  TestValidator.equals("decimal numeric cut succeeds", decimal.success, true);
  if (decimal.success)
    TestValidator.equals(
      "the reconstructed end is present at the end of the numeric play",
      sequenceEventTimeline(decimal.sequence, [shot]).map(output),
      [{ id: anchor.id, time: 0.05 }],
    );

  const tiny: IAutoMovieShot = { ...shot, events: [{ ...anchor, time: 1 }] };
  const collapsed = cutSequence(
    {
      ...plan,
      entries: [
        {
          shot: tiny.id,
          trim: { start: 1, duration: 1e-17 },
          playbackRate: 1e-17,
          transition: null,
        },
      ],
    },
    [tiny],
  );
  TestValidator.equals("the tiny source span plays", collapsed.success, true);
  if (collapsed.success) {
    TestValidator.equals("retimed output duration", collapsed.runtime, 1);
    TestValidator.equals(
      "the opening event precedes the end of the retimed play",
      sequenceEventTimeline(collapsed.sequence, [tiny]).map(output),
      [{ id: anchor.id, time: 0 }],
    );
  }
}

/** Extract the visible event identity and its time on the output clock. */
function output(event: IAutoMoviePlaybackEvent): { id: string; time: number } {
  return { id: event.id, time: event.globalTime };
}
