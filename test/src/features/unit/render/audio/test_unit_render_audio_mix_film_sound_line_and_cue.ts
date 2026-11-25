import type { IAutoMovieFilmSound } from "@automovie/interface";
import { mixAutoMovieFilmSound } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { createDialogueReceiptFixture } from "../../../internal/createDialogueReceiptFixture";

/**
 * `mixAutoMovieFilmSound` mixes a line and a cue into a WAVE master, binding
 * every input into its fingerprint.
 *
 * Scenarios:
 *
 * 1. One spoken line of half a second at frame 0 and one effects cue of a
 *    second at frame 24, in a film of 48 frames at 24 per second, mix into a
 *    plan of that line, ending at frame 12, and that cue, and a 16-bit stereo
 *    WAVE of two seconds that is not silent.
 * 2. Mixing the same inputs again gives the same fingerprint and digest; a
 *    changed cue asset changes the fingerprint.
 * 3. A line id declared twice, a line that speaks past the film's end and an
 *    asset that cannot be read are refused.
 */
export async function test_unit_render_audio_mix_film_sound_line_and_cue(): Promise<void> {
  // A 1 kHz tone of amplitude 0.25, about -16 LUFS, inside the mix's correction.
  const speech: Float32Array = Float32Array.from(
    { length: 24_000 },
    (_: unknown, index: number): number =>
      0.25 * Math.sin((2 * Math.PI * 1000 * index) / 48_000),
  );
  const cueSamples: Float32Array = new Float32Array(48_000).fill(0.1);
  const line = createDialogueReceiptFixture({
    line: "l1",
    text: "hello",
    samples: speech,
    sampleRate: 48_000,
  });
  const cue = createDialogueReceiptFixture({
    line: "cue",
    text: "x",
    samples: cueSamples,
    sampleRate: 48_000,
  });
  const files: Map<string, Uint8Array> = new Map([
    ["l1.pcm", line.pcm],
    ["l1.json", line.receiptBytes],
    ["cue.wav", cue.pcm],
    ["line.wav", line.pcm],
  ]);
  const read = async (path: string): Promise<Uint8Array> => {
    const bytes: Uint8Array | undefined = files.get(path);
    if (bytes === undefined) throw new Error(`no ${path}`);
    return bytes;
  };
  const dialogue = (
    id: string,
    startFrame: number,
  ): IAutoMovieFilmSound["lines"][number] => ({
    id,
    text: "hello",
    language: "en",
    startFrame,
    pcm: "l1.pcm",
    receipt: "l1.json",
  });
  const effect: IAutoMovieFilmSound["cues"][number] = {
    id: "door",
    asset: "cue.wav",
    sourceDurationFrames: 24,
    sourceOffsetFrame: 0,
    startFrame: 24,
    durationFrames: 24,
    gain: 1,
    fadeInFrames: 0,
    fadeOutFrames: 0,
    bus: "effects",
  };
  const mix = (
    patch: Partial<IAutoMovieFilmSound> = {},
    reader: (path: string) => Promise<Uint8Array> = read,
  ) =>
    mixAutoMovieFilmSound({
      sound: {
        lines: [dialogue("l1", 0)],
        cues: [effect],
        speakers: [],
        ...patch,
      },
      frameRate: { numerator: 24, denominator: 1 },
      totalFrames: 48,
      read: reader,
    });

  const first = await mix();
  TestValidator.equals(
    "plan",
    [
      first.plan.dialogue.map((entry) => [
        entry.id,
        entry.startFrame,
        entry.endFrame,
      ]),
      first.plan.cues.map((entry) => entry.id),
      first.lines.length,
    ],
    [[["l1", 0, 12]], ["door"], 1],
  );
  TestValidator.equals("wave size", first.wav.length, 44 + 96_000 * 4);
  TestValidator.predicate(
    "not silent",
    first.wav.subarray(44).some((byte: number): boolean => byte !== 0),
  );
  const again = await mix();
  TestValidator.equals(
    "stable",
    [again.plan.inputFingerprint, again.sha256],
    [first.plan.inputFingerprint, first.sha256],
  );
  const other = await mix({ cues: [{ ...effect, asset: "line.wav" }] });
  TestValidator.predicate(
    "asset changes the fingerprint",
    other.plan.inputFingerprint !== first.plan.inputFingerprint,
  );

  await TestValidator.error("duplicate line", async (): Promise<void> => {
    await mix({ lines: [dialogue("l1", 0), dialogue("l1", 12)] });
  });
  await TestValidator.error("past the end", async (): Promise<void> => {
    await mix({ lines: [dialogue("l1", 44)] });
  });
  await TestValidator.error("unreadable", async (): Promise<void> => {
    await mix({}, async (path: string): Promise<Uint8Array> => {
      throw new Error(`no ${path}`);
    });
  });
}
