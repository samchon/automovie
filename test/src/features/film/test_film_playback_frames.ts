import {
  IAutoMoviePlaybackSample,
  playbackFrameSamples,
} from "@automovie/engine";
import { IAutoMovieSequence, IAutoMovieShot } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

const shot: (id: string, duration: number) => IAutoMovieShot = (
  id: string,
  duration: number,
): IAutoMovieShot => ({
  id,
  name: null,
  scene: "scene-duel",
  camera: "cam-main",
  cameraMotion: null,
  performances: [],
  objectMotions: [],
  duration,
});

/**
 * Samples two one-second shots at four fps, checking eight frame identities, restarted quarter-second local clocks and invalid fps errors.
 *
 * Scenarios:
 * 1. Resolve all eight hard-cut frames on the independent quarter-second grid.
 * 2. Refuse zero fps with the stated field/range diagnosis.
 * 3. Refuse NaN fps with a finiteness diagnosis.
 *
 * @evidence contracts/testing.md#behavioral-verification Samples two one-second shots at four fps, checking eight frame identities, restarted quarter-second local clocks and invalid fps errors.
 * @evidence contracts/testing.md#independent-expectations The frame grid i/4 has eight instants strictly below two seconds; i modulo four supplies the independent local-clock expectation and the second shot owns frame four.
 * @evidence contracts/testing.md#distinguishing-cases Retains the hard-cut boundary, all eight frames, zero and NaN fps; dissolves and trim/event seams belong to resolver tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_film_playback_frames unit entry owns its assertions and delegated helpers through portable source functions; it opens no process, browser, GPU or installed consumer.
 */
export function test_film_playback_frames(): void {
  const sequence: IAutoMovieSequence = {
    id: "seq",
    name: null,
    fps: 4,
    shots: [
      { shot: "a", trim: null, transition: null },
      { shot: "b", trim: null, transition: null },
    ],
  };
  const samples: IAutoMoviePlaybackSample[] = playbackFrameSamples(sequence, [
    shot("a", 1),
    shot("b", 1),
  ]);
  TestValidator.equals("frame count", samples.length, 8);
  TestValidator.equals(
    "shot per frame",
    samples.map((s: IAutoMoviePlaybackSample): string => s.shot),
    ["a", "a", "a", "a", "b", "b", "b", "b"],
  );
  TestValidator.predicate(
    "local times ride the frame grid",
    samples.every((s: IAutoMoviePlaybackSample, i: number): boolean =>
      nclose(s.time, (i % 4) / 4),
    ),
  );
  TestValidator.predicate(
    "frame sampling rejects zero fps",
    throwsError(
      (): IAutoMoviePlaybackSample[] =>
        playbackFrameSamples({ ...sequence, fps: 0 }, [shot("a", 1)]),
      ["sequence fps", "> 0", "0"],
    ),
  );
  TestValidator.predicate(
    "frame sampling rejects non-finite fps",
    throwsError(
      (): IAutoMoviePlaybackSample[] =>
        playbackFrameSamples({ ...sequence, fps: Number.NaN }, [shot("a", 1)]),
      ["sequence fps", "finite", "NaN"],
    ),
  );
}
