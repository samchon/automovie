import { playbackFrameSamples } from "@automovie/engine";
import {
  type IAutoMoviePlaybackSample,
  IAutoMovieSequence,
  IAutoMovieShot,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../../internal/predicates";

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
 */
export function test_unit_engine_film_film_playback_frames(): void {
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
