import { AutoMovieEngineFilm } from "@automovie/engine";
import {
  type IAutoMovieCut,
  type IAutoMovieEditPlan,
  type IAutoMovieInteractionEvent,
  type IAutoMoviePlaybackEntry,
  type IAutoMoviePlaybackEvent,
  type IAutoMoviePlaybackSample,
  type IAutoMovieSequenceEntry,
  type IAutoMovieSequenceRenderFrame,
  type IAutoMovieSequenceRenderPlan,
  type IAutoMovieShot,
} from "@automovie/interface";
import { AutoMovieRenderSequence } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../internal/predicates";

/**
 * Retain one source range while changing its output duration and timing.
 *
 * Scenarios:
 *
 * 1. A two-second excerpt at 2× and 0.5× takes one and four output seconds.
 * 2. A half-second dissolve samples each excerpt at its own playback rate.
 * 3. A repeated event follows each play.
 * 4. Default playback retains the legacy record. Invalid rates, nonrepresentable
 *    output spans and overlaps longer than the retimed entry are refused.
 */
export function test_engine_film_playback_rate(): void {
  const handoff: IAutoMovieInteractionEvent = {
    id: "handoff",
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
    id: "table",
    name: null,
    scene: "table",
    camera: "main",
    cameraMotion: null,
    performances: [],
    objectMotions: [],
    duration: 4,
    events: [handoff],
  };
  const entry: IAutoMovieSequenceEntry = {
    shot: shot.id,
    trim: { start: 0.5, duration: 2 },
    transition: null,
  };
  const plan: IAutoMovieEditPlan = {
    sequence: { id: "at-table", name: "At the table" },
    fps: 24,
    entries: [
      { ...entry, playbackRate: 2 },
      {
        ...entry,
        playbackRate: 0.5,
        transition: { kind: "crossDissolve", duration: 0.5 },
      },
    ],
    pacing: "Compress the first pass and slow the second.",
    continuity: "Replay the same excerpt.",
    requiredEvents: [
      { entry: 0, event: handoff.id },
      { entry: 1, event: handoff.id },
    ],
  };

  const cut: IAutoMovieCut = AutoMovieEngineFilm.cutSequence(plan, [shot]);
  if (!cut.success) throw new Error("both plays must retain the handoff");

  TestValidator.predicate("retimed cut runtime", nclose(cut.runtime, 4.5));
  const render: IAutoMovieSequenceRenderPlan = AutoMovieRenderSequence.plan({
    sequence: cut.sequence,
    shots: [shot],
    spec: {
      target: cut.sequence.id,
      frameFormat: { fps: 4, width: 640, height: 360 },
      toneMapping: "none",
      codec: "h264",
      pixelFormat: "yuv420p",
      crf: 20,
    },
  });
  TestValidator.equals("render frame count", render.frameCount, 18);
  TestValidator.predicate(
    "render keeps output spans and source trims distinct",
    nclose(render.shots[0]!.played, 1) &&
      nclose(render.shots[1]!.played, 4) &&
      nclose(render.shots[0]!.trim?.duration ?? NaN, 2) &&
      nclose(render.shots[1]!.trim?.duration ?? NaN, 2) &&
      nclose(render.shots[0]!.playbackRate ?? NaN, 2) &&
      nclose(render.shots[1]!.playbackRate ?? NaN, 0.5) &&
      nclose(render.transitionSpans[0]!.start, 0.5) &&
      nclose(render.transitionSpans[0]!.end, 1),
  );
  const frame: IAutoMovieSequenceRenderFrame = render.frames[3]!;
  TestValidator.predicate(
    "render frame samples both rates during the dissolve",
    nclose(frame.shotTimeSeconds, 0.625) &&
      nclose(frame.blend?.shotTimeSeconds ?? NaN, 2) &&
      nclose(frame.blend?.alpha ?? NaN, 0.5),
  );
  const scrubbed: IAutoMoviePlaybackSample | null =
    AutoMovieEngineFilm.resolveSequencePlayback(cut.sequence, [shot], 0.75);
  TestValidator.predicate(
    "random access samples the same dissolve",
    nclose(scrubbed?.time ?? NaN, 0.625) &&
      nclose(scrubbed?.blend?.time ?? NaN, 2) &&
      nclose(scrubbed?.blend?.alpha ?? NaN, 0.5),
  );
  const replays: IAutoMoviePlaybackEvent[] =
    AutoMovieEngineFilm.sequenceEventTimeline(cut.sequence, [shot]).filter(
      (event: IAutoMoviePlaybackEvent): boolean => event.id === handoff.id,
    );
  TestValidator.equals(
    "one handoff per retained play",
    replays.map((event: IAutoMoviePlaybackEvent): number => event.entry),
    [0, 1],
  );
  TestValidator.predicate(
    "events project through the inverse rate",
    nclose(replays[0]!.shotTime, 1.5) &&
      nclose(replays[0]!.globalTime, 0.5) &&
      nclose(replays[1]!.globalTime, 2.5),
  );

  const legacy: IAutoMovieCut = AutoMovieEngineFilm.cutSequence(
    {
      ...plan,
      entries: [entry, { ...entry, playbackRate: 1 }],
      requiredEvents: [],
    },
    [shot],
  );
  if (!legacy.success) throw new Error("unit rates must be admitted");
  TestValidator.equals(
    "unit rate preserves the entry shape",
    legacy.sequence.shots,
    [entry, entry],
  );
  // The whole placement is compared, so a `playbackRate` field on it is a
  // difference: the two-second trim plays for two seconds from its 0.5 s start.
  const placement: IAutoMoviePlaybackEntry = {
    entry: 0,
    shot: shot.id,
    start: 0,
    played: 2,
    offset: 0.5,
  };
  TestValidator.equals(
    "legacy playback placement has no rate field",
    AutoMovieEngineFilm.sequenceTimeline(legacy.sequence, [shot]).entries[0]!,
    placement,
  );

  for (const playbackRate of [0, -1, Number.MIN_VALUE]) {
    const invalid: IAutoMovieCut = AutoMovieEngineFilm.cutSequence(
      { ...plan, entries: [{ ...entry, playbackRate }], requiredEvents: [] },
      [shot],
    );
    TestValidator.equals(
      `invalid or unrepresentable rate ${playbackRate}`,
      invalid.success ? undefined : invalid.violations[0]?.path,
      "$input.entries[0].playbackRate",
    );
  }
  const underflow: IAutoMovieCut = AutoMovieEngineFilm.cutSequence(
    {
      ...plan,
      entries: [{ ...entry, trim: null, playbackRate: 2 }],
      requiredEvents: [],
    },
    [{ ...shot, duration: Number.MIN_VALUE }],
  );
  TestValidator.equals(
    "output span underflows to zero",
    underflow.success ? undefined : underflow.violations[0]?.path,
    "$input.entries[0].playbackRate",
  );
  TestValidator.predicate(
    "direct layout rejects an invalid rate",
    throwsError(
      (): unknown =>
        AutoMovieEngineFilm.sequenceTimeline(
          { ...cut.sequence, shots: [{ ...entry, playbackRate: 0 }] },
          [shot],
        ),
      "sequence.shots[0].playbackRate",
    ),
  );

  const overlap: IAutoMovieCut = AutoMovieEngineFilm.cutSequence(
    {
      ...plan,
      entries: [
        plan.entries[0]!,
        { ...entry, transition: { kind: "crossDissolve", duration: 1.5 } },
      ],
      requiredEvents: [],
    },
    [shot],
  );
  TestValidator.equals(
    "overlap is bounded by the shortened outgoing output span",
    overlap.success ? undefined : overlap.violations[0]?.path,
    "$input.entries[1].transition.duration",
  );
}
