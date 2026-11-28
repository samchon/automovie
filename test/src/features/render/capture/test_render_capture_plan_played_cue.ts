import type {
  IAutoMovieCaptureSubject,
  IAutoMoviePlaybackEvent,
} from "@automovie/interface";
import { AutoMovieRenderCapture } from "@automovie/render";
import assert from "node:assert/strict";

/**
 * A source cue selects one played entry and its bounded native neighborhood.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names repeated source events, their played entry, the continuous pose and its native neighborhood.
 * @evidence contracts/development/testing.md#behavioral-verification Parses requests through the capture grammar, then checks the planner's ambiguity, retained event metadata, file addresses and legacy beat.
 * @evidence contracts/development/testing.md#independent-expectations At 24 Hz, frame six is exactly 0.25 s. A cue at 0.2500002 s shares its millisecond caption yet lies between native samples. Radius one gives frames five through seven, and the separate pose has no native frame.
 */
export function test_render_capture_plan_played_cue(): void {
  const source: IAutoMoviePlaybackEvent = {
    id: "seat.contact",
    kind: "attach",
    source: "scriptedCue",
    time: 0.5000004,
    shotTime: 0.5000004,
    actor: "actor",
    target: "partner",
    object: "cup",
    point: null,
    actionIndex: 0,
    reaction: null,
    shot: "seat-shot",
    entry: 0,
    globalTime: 0.2500002,
  };
  const subject: IAutoMovieCaptureSubject = {
    name: "seat",
    durationSeconds: 2.5,
    fps: 24,
    width: 128,
    height: 64,
    views: [],
    drawables: [],
    marks: [],
    instants: [{ seconds: 0.25, label: "legacy beat" }],
    playedCues: [source, { ...source, entry: 1, globalTime: 1.5000008 }],
  };
  const plan = (query: string) =>
    AutoMovieRenderCapture.plan({
      request: AutoMovieRenderCapture.parsePlanRequest(
        new URLSearchParams(query),
      ),
      subject,
      cuts: [],
    });
  assert.throws(
    () => plan("cue=seat.contact"),
    /entry 0 at 0\.2500002 s, entry 1 at 1\.5000008 s/u,
  );
  assert.throws(() => plan("cue=seat.contact&entry=2"), /no played cue/u);
  assert.throws(() => plan("cue=seat.contact&events=0.2"), /cue excludes/u);
  assert.throws(() => plan("entry=0"), /entry requires cue/u);

  const selected = plan("cue=seat.contact&entry=0&window=1");
  assert.deepEqual(selected.playedCue, source);
  assert.notEqual(selected.playedCue, source);
  assert.deepEqual(selected.windows, [
    {
      kind: "event",
      seconds: source.globalTime,
      frame: 6,
      first: 5,
      last: 7,
      clipped: false,
    },
  ]);
  assert.deepEqual(selected.times, [
    { seconds: 5 / 24, frame: 5 },
    { seconds: 0.25, frame: 6 },
    { seconds: source.globalTime, frame: null },
    { seconds: 7 / 24, frame: 7 },
  ]);
  assert.equal(selected.cells[1]!.label, "legacy beat");
  assert.equal(selected.cells[2]!.label, "seat.contact");
  assert.match(selected.cells[2]!.name, /-pose-/u);
  assert.deepEqual(AutoMovieRenderCapture.formatPlanRequest(selected.request), [
    ["cue", "seat.contact"],
    ["entry", "0"],
    ["window", "1"],
  ]);
}
