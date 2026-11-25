import { playbackFrameSamples } from "@automovie/engine";
import type {
  IAutoMoviePlaybackSample,
  IAutoMovieSequence,
  IAutoMovieShot,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../internal/predicates";

/**
 * `playbackFrameSamples` samples a sequence frame by frame, restarting each
 * shot's local clock.
 *
 * Sequence: shots "a" and "b", each one second long, hard cut, at 4 fps.
 *
 * Scenarios:
 *
 * 1. Eight frames: a, a, a, a, b, b, b, b, with local times 0, 0.25, 0.5, 0.75 in
 *    each shot.
 * 2. A frame rate of 0 is refused with a message naming "sequence fps", "> 0" and
 *    "0".
 */
export function test_engine_film_playback_frames(): void {
  const shot = (id: string, duration: number): IAutoMovieShot => ({
    id,
    name: null,
    scene: "scene-duel",
    camera: "cam-main",
    cameraMotion: null,
    performances: [],
    objectMotions: [],
    duration,
  });
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
  TestValidator.equals("count", samples.length, 8);
  TestValidator.equals(
    "shots",
    samples.map((s: IAutoMoviePlaybackSample): string => s.shot),
    ["a", "a", "a", "a", "b", "b", "b", "b"],
  );
  samples.forEach((s: IAutoMoviePlaybackSample, i: number): void => {
    TestValidator.predicate(`time ${i}`, nclose(s.time, (i % 4) / 4, 1e-12));
  });
  TestValidator.predicate(
    "zero fps",
    throwsError(
      () => playbackFrameSamples({ ...sequence, fps: 0 }, [shot("a", 1)]),
      ["sequence fps", "> 0", "0"],
    ),
  );
}
