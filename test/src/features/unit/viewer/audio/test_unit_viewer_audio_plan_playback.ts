import { planAutoMovieAudioPlayback } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * `planAutoMovieAudioPlayback` starts each still-sounding cue: a sounding cue
 * at once, part-way in by its rate times the elapsed film time; a later cue
 * after its film delay over the transport rate; an ended cue not at all.
 *
 * Scenarios, starting at film second 2 at transport rate 2:
 *
 * 1. Cue "a" at 0 s, offset 1 s into a 10 s source: no delay, offset 3, (9 − 2) /
 *    2 = 3.5 wall seconds, playback rate 2.
 * 2. Cue "b" at 5 s for 2 s at rate 0.5, panned −1: delay 1.5, offset 0, 1 wall
 *    second, playback rate 1.
 * 3. Cue "c" at 0 s for 1 s has ended.
 * 4. A cue of an unknown asset throws.
 */
export function test_unit_viewer_audio_plan_playback(): void {
  TestValidator.equals(
    "the starts",
    planAutoMovieAudioPlayback(
      [
        { asset: "a", seconds: 0, gain: 0.5, offsetSeconds: 1 },
        {
          asset: "b",
          seconds: 5,
          gain: 1,
          durationSeconds: 2,
          rate: 0.5,
          pan: -1,
        },
        { asset: "c", seconds: 0, gain: 1, durationSeconds: 1 },
      ],
      2,
      2,
      { a: 10, b: 4, c: 4 },
    ),
    [
      {
        asset: "a",
        delay: 0,
        offset: 3,
        duration: 3.5,
        gain: 0.5,
        pan: 0,
        playbackRate: 2,
      },
      {
        asset: "b",
        delay: 1.5,
        offset: 0,
        duration: 1,
        gain: 1,
        pan: -1,
        playbackRate: 1,
      },
    ],
  );
  TestValidator.error(
    "an unknown asset",
    (): planAutoMovieAudioPlayback.IStart[] =>
      planAutoMovieAudioPlayback(
        [{ asset: "x", seconds: 0, gain: 1 }],
        0,
        1,
        {},
      ),
  );
}
