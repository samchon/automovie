import { AutoMovieViewerAudio } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieViewerAudio.planPlayback` starts each still-sounding cue: a sounding cue
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
 *
 * @evidence contracts/development/common.md#meaningful-documentation Schedules still-sounding and future cues under transport rate and refuses unknown assets.
 * @evidence contracts/development/testing.md#behavioral-verification Calls playback planning on two live or future cues, one ended cue and an unknown source, with transport beginning at second two at double speed.
 * @evidence contracts/development/testing.md#independent-expectations Source offset, elapsed cue time and the two effective playback rates give the literal delay, start offset and durations. The ended cue cannot contribute a start.
 */
export function test_viewer_audio_plan_playback(): void {
  TestValidator.equals(
    "the starts",
    AutoMovieViewerAudio.planPlayback({
      cues: [
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
      seconds: 2,
      rate: 2,
      lengths: { a: 10, b: 4, c: 4 },
    }),
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
    (): AutoMovieViewerAudio.IStart[] =>
      AutoMovieViewerAudio.planPlayback({
        cues: [{ asset: "x", seconds: 0, gain: 1 }],
        seconds: 0,
        rate: 1,
        lengths: {},
      }),
  );
}
