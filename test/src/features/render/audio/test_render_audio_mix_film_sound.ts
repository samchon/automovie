import { AutoMovieRenderAudio } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieRenderAudio.mixFilmSound` mixes a film's lines and cues into one 48 kHz stereo
 * WAVE master.
 *
 * Scenarios:
 *
 * 1. A film with no lines and no cues, 24 frames at 24 per second, is a plan of
 *    24 frames with no cue and no dialogue and a WAVE file that no asset was
 *    read for.
 * 2. Mixing the same input again gives the same fingerprint and digest.
 */
export async function test_render_audio_mix_film_sound(): Promise<void> {
  const mix = () =>
    AutoMovieRenderAudio.mixFilmSound({
      sound: { lines: [], cues: [], speakers: [] },
      frameRate: { numerator: 24, denominator: 1 },
      totalFrames: 24,
      read: async (path: string): Promise<Uint8Array> => {
        throw new Error(`unexpected read of ${path}`);
      },
    });
  const first = await mix();
  TestValidator.equals(
    "plan",
    [first.plan.totalFrames, first.plan.cues, first.plan.dialogue, first.lines],
    [24, [], [], []],
  );
  TestValidator.equals(
    "RIFF header",
    String.fromCharCode(...first.wav.subarray(0, 4)),
    "RIFF",
  );
  const second = await mix();
  TestValidator.equals(
    "stable",
    [second.plan.inputFingerprint, second.sha256],
    [first.plan.inputFingerprint, first.sha256],
  );
}