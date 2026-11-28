import { AutoMovieEngineFilm } from "@automovie/engine";
import type {
  IAutoMovieCut,
  IAutoMovieFilmOptics,
  IAutoMovieInteractionEvent,
  IAutoMovieRenderSoftPropFrame,
  IAutoMovieShot,
} from "@automovie/interface";
import type { IAutoMovieRenderDrawScene } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import type { IFilm } from "../../src/IFilm";
import type { IFilmProduction } from "../../src/IFilmProduction";
import { subjectOfFilm } from "../../src/subjectOfFilm";

/**
 * A film becomes its draw subject with every placement passed through: the shot
 * and its shot-local time of `seekShot` unclamped, the film second clamped to
 * the running time, and the soft props read after every placement.
 *
 * Scenarios, on a 15 s film whose production records each call:
 *
 * 1. `seekShot` of shot A at −1/64 s, a shutter sample's handle, during film
 *    second 20 places A at −1/64 s during 15 s, then reads the soft props at 15
 *    s.
 * 2. `seek` and `place` at −1 s place the film at 0 s, each then reading the soft
 *    props at 0 s, and `optics` at 20 s reads the film's optics at 15 s.
 * 3. A film without `seekShot` gives a subject without it.
 * 4. The played cue survives a source trim and 2× playback with its exact shot and
 *    film times. Without the authored shots, playback keeps its declared trail
 *    breaks and leaves cue metadata absent.
 * 5. A rejected shot list disposes the film before the mount rejects.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes shot and film placement, post-placement readers and the retimed cue and declared trail breaks with their source-absent controls.
 * @evidence contracts/development/testing.md#behavioral-verification Creates the registered draw subject with and without authored shots. Checks placement calls in order, verifies cue metadata after the trim, checks the original shot-local break list, and observes disposal after a rejected projection.
 * @evidence contracts/development/testing.md#independent-expectations The film clock clamps to 0 and 15 s and the shot handle stays at −1/64 s. A cue at source second 2, with a source trim starting at 1 and running at twice speed, occurs at output second 0.5. A source event at 0.5 is outside that trim.
 */
export async function test_subject_of_film(): Promise<void> {
  const calls: string[] = [];
  let disposals: number = 0;
  const film: (
    seekShot: boolean,
    playback?: IFilmProduction["playback"],
  ) => IFilm = (
    seekShot: boolean,
    playback?: IFilmProduction["playback"],
  ): IFilm => ({
    durationSeconds: 15,
    fps: 24,
    create: async (): Promise<IFilmProduction> => ({
      scene: new THREE.Scene(),
      camera: new THREE.PerspectiveCamera(),
      ...(playback === undefined ? {} : { playback }),
      seek: (seconds: number): void => {
        calls.push(`seek ${seconds}`);
      },
      ...(seekShot
        ? {
            seekShot: (
              shot: string,
              seconds: number,
              filmSeconds: number,
            ): void => {
              calls.push(`seekShot ${shot} ${seconds} ${filmSeconds}`);
            },
          }
        : {}),
      softPropsAt: (seconds: number): IAutoMovieRenderSoftPropFrame[] => {
        calls.push(`softProps ${seconds}`);
        return [];
      },
      optics: (seconds: number): IAutoMovieFilmOptics => {
        calls.push(`optics ${seconds}`);
        return { ev100: 10, toneMapping: "none" };
      },
      dispose: (): void => {
        disposals += 1;
      },
    }),
  });
  const subject: IAutoMovieRenderDrawScene = await subjectOfFilm(
    "film",
    film(true),
  ).create();

  // 1. A shot placement.
  await subject.seekShot!("shot:a", -1 / 64, 20);
  TestValidator.equals(
    "seekShot passes the shot-local time unclamped and clamps the film second",
    calls.splice(0),
    [`seekShot shot:a ${-1 / 64} 15`, "softProps 15"],
  );

  // 2. Film placements and a reader.
  await subject.seek(-1);
  subject.place!(-1);
  subject.optics!(20);
  TestValidator.equals(
    "film placements and readers take the clamped film second",
    calls.splice(0),
    ["seek 0", "softProps 0", "seek 0", "softProps 0", "optics 15"],
  );
  subject.dispose();

  // 3. A film without seekShot.
  const bare: IAutoMovieRenderDrawScene = await subjectOfFilm(
    "film",
    film(false),
  ).create();
  TestValidator.equals("no seekShot", bare.seekShot, undefined);
  TestValidator.equals("no playback cues", bare.playedCues, undefined);
  TestValidator.equals(
    "no authored trail breaks",
    bare.trailDiscontinuities,
    undefined,
  );
  bare.dispose();

  const cue: IAutoMovieInteractionEvent = {
    id: "offer",
    kind: "attach",
    source: "scriptedCue",
    time: 2,
    actor: "giver",
    target: "giver",
    object: "bottle",
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
    duration: 4,
    events: [{ ...cue, id: "before-trim", time: 0.5 }, cue],
  };
  const cut: IAutoMovieCut = AutoMovieEngineFilm.cutSequence(
    {
      sequence: { id: "cut", name: "Handoff" },
      fps: 24,
      entries: [
        {
          shot: shot.id,
          trim: { start: 1, duration: 2 },
          playbackRate: 2,
          transition: null,
        },
      ],
      requiredEvents: [{ entry: 0, event: cue.id }],
      pacing: "Lead with the offer.",
      continuity: "Keep the same object in view.",
    },
    [shot],
  );
  if (!cut.success) throw new Error("Expected the cue cut to be admitted");
  const discontinuities = [{ shot: shot.id, seconds: 1.625 }];
  const playback: IFilmProduction["playback"] = {
    sequence: cut.sequence,
    timeline: AutoMovieEngineFilm.sequenceTimeline(cut.sequence, [shot]),
    discontinuities,
  };
  const withShots: IAutoMovieRenderDrawScene = await subjectOfFilm(
    "film",
    film(true, { ...playback, shots: [shot] }),
  ).create();
  try {
    TestValidator.equals("one exact played cue", withShots.playedCues, [
      { ...cue, entry: 0, shot: "handoff", shotTime: 2, globalTime: 0.5 },
    ]);
  } finally {
    withShots.dispose();
  }
  const withoutShots: IAutoMovieRenderDrawScene = await subjectOfFilm(
    "film",
    film(true, playback),
  ).create();
  try {
    TestValidator.equals(
      "existing cut stays available",
      withoutShots.cut,
      playback.timeline,
    );
    TestValidator.equals(
      "no authored shot cues",
      withoutShots.playedCues,
      undefined,
    );
    TestValidator.predicate(
      "authored trail breaks retain their shot-local clocks without cue inputs",
      withoutShots.trailDiscontinuities === discontinuities,
    );
  } finally {
    withoutShots.dispose();
  }
  const previousDisposals: number = disposals;
  await TestValidator.error(
    "missing referenced shot",
    async (): Promise<void> => {
      await subjectOfFilm(
        "film",
        film(true, { ...playback, shots: [] }),
      ).create();
    },
  );
  TestValidator.equals(
    "refusal disposes once",
    disposals,
    previousDisposals + 1,
  );
}
