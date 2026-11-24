import type {
  IAutoMovieDialogueMouthTrack,
  IAutoMovieFilmSound,
  IAutoMovieMixFilmSound,
  IAutoMovieProductionPhonemeChunk,
} from "@automovie/interface";
import {
  admitAutoMovieFilmDialogue,
  planAutoMovieDialogueMouths,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { createDialogueReceiptFixture } from "../internal/createDialogueReceiptFixture";
import { nclose, rejectsError } from "../internal/predicates";

/**
 * A film's admitted lines plan the mouths each bound actor is handed.
 *
 * Scenarios:
 *
 * 1. Of four lines at 24 fps and 48 kHz, the two whose speakers bind to one actor
 *    enter the track, in list order; a line with an unbound speaker and one
 *    without a speaker move no mouth.
 * 2. The phoneme-driven line from frame 2, four frames of 2000 samples (silence,
 *    −20 dBFS RMS, −35 dBFS RMS, silence), spans frames 2 to 6; levelled as the
 *    mix places it, its silent frames open the jaw 0 mm and its loud frame
 *    opens it 6 mm more than its middle frame.
 * 3. Its chunk /ama/ over samples 0 to 6000 gives `aa`, `PP` and `aa` one frame
 *    each from frame 2.
 * 4. The line without chunks carries its jaw and no viseme ranges.
 * 5. Planning twice gives the same track, and a line that speaks past the film's
 *    last frame is refused by the admission.
 * 6. The same line generated 12 dB quieter, which the mix levels to the same
 *    audio, opens the jaw the same on every frame.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the lines, their samples and bindings, and the track each must give.
 * @evidence contracts/development/testing.md#behavioral-verification Admits in-memory WAVE files and receipts through `admitAutoMovieFilmDialogue` and plans them with `planAutoMovieDialogueMouths`. A planner that keeps unbound lines, reads the whole line's level instead of each frame's, reads the line before levelling, places phonemes off the emission clock or drops the envelope from a phoneme-driven line fails.
 * @evidence contracts/development/testing.md#independent-expectations A square wave of amplitude A has RMS A. Levelling adds one gain in dB to every frame, so the −20 and −35 dBFS frames stay 15 dB apart, and the envelope's documented 12 mm over the 30 dB from −50 to −20 dBFS makes that 6 mm while both stay in that range, as they do for a gain within the ±12 dB the mix allows that keeps the loud frame at or below −20 dBFS. A take 12 dB quieter is levelled by 12 dB more, so its levelled samples equal the louder take's to Float32 rounding. 2000 samples are one frame at 24 fps and 48 kHz, and 2000-sample phoneme shares are one frame each.
 * @evidence contracts/development/testing.md#distinguishing-cases Pairs bound and unbound lines, a phoneme-driven and an envelope line, loud, middle and silent frames, two takes at different levels, and an admitted and a refused span; sampling the track belongs to `test_engine_dialogue_mouth_sample` and receipt refusals to `test_ingest_sound_receipt_admission`.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through `test_render_dialogue_mouth_track`; files are bytes in a map and nothing is launched.
 */
export async function test_render_dialogue_mouth_track(): Promise<void> {
  const files: Map<string, Uint8Array> = new Map();
  const square: (amplitude: number, length: number) => number[] = (
    amplitude: number,
    length: number,
  ): number[] =>
    Array.from({ length }, (_: unknown, index: number): number =>
      index % 2 === 0 ? amplitude : -amplitude,
    );
  const line: (
    id: string,
    samples: number[],
    phonemeChunks?: IAutoMovieProductionPhonemeChunk[],
  ) => void = (
    id: string,
    samples: number[],
    phonemeChunks?: IAutoMovieProductionPhonemeChunk[],
  ): void => {
    const fixture: ReturnType<typeof createDialogueReceiptFixture> =
      createDialogueReceiptFixture({
        line: id,
        text: id,
        samples: Float32Array.from(samples),
        sampleRate: 48_000,
        ...(phonemeChunks === undefined ? {} : { phonemeChunks }),
      });
    files.set(`lines/${id}.wav`, fixture.pcm);
    files.set(`lines/${id}.json`, fixture.receiptBytes);
  };
  const middle: number = 10 ** (-35 / 20);
  const spoken: (gain: number) => number[] = (gain: number): number[] => [
    ...square(0, 2000),
    ...square(0.1 * gain, 2000),
    ...square(middle * gain, 2000),
    ...square(0, 2000),
  ];
  line("ana-1", spoken(1), [
    { phonemes: "ama", startSample: 0, endSample: 6000 },
  ]);
  line("ana-quiet", spoken(10 ** (-12 / 20)), [
    { phonemes: "ama", startSample: 0, endSample: 6000 },
  ]);
  line("ben-1", square(0.1, 2000));
  line("nar-1", square(0.1, 2000));
  line("off-1", square(0.1, 2000));

  const entry: (
    id: string,
    startFrame: number,
    speaker?: string,
  ) => IAutoMovieFilmSound.ILine = (
    id: string,
    startFrame: number,
    speaker?: string,
  ): IAutoMovieFilmSound.ILine => ({
    id,
    text: id,
    language: "en",
    ...(speaker === undefined ? {} : { speaker }),
    startFrame,
    pcm: `lines/${id}.wav`,
    receipt: `lines/${id}.json`,
  });
  const sound: IAutoMovieFilmSound = {
    lines: [
      entry("ana-1", 2, "ana"),
      entry("nar-1", 3, "narrator"),
      entry("ben-1", 8, "ben"),
      entry("off-1", 10),
    ],
    cues: [],
    speakers: [
      { speaker: "ana", actor: "actor-ana" },
      { speaker: "ben", actor: "actor-ben" },
    ],
  };
  const read: (path: string) => Promise<Uint8Array> = async (
    path: string,
  ): Promise<Uint8Array> => {
    const bytes: Uint8Array | undefined = files.get(path);
    if (bytes === undefined) throw new Error(`ENOENT ${path}`);
    return bytes;
  };
  const frameRate: { numerator: number; denominator: number } = {
    numerator: 24,
    denominator: 1,
  };
  const plan: (
    listed?: IAutoMovieFilmSound,
  ) => Promise<IAutoMovieDialogueMouthTrack> = async (
    listed: IAutoMovieFilmSound = sound,
  ): Promise<IAutoMovieDialogueMouthTrack> => {
    const lines: IAutoMovieMixFilmSound.ILine[] =
      await admitAutoMovieFilmDialogue({
        sound: listed,
        frameRate,
        totalFrames: 24,
        read,
      });
    return planAutoMovieDialogueMouths({
      lines,
      speakers: listed.speakers,
      frameRate,
    });
  };

  const track: IAutoMovieDialogueMouthTrack = await plan();
  TestValidator.equals(
    "only lines bound to one actor enter, in list order",
    [
      track.fps,
      track.lines.map(
        (planned: IAutoMovieDialogueMouthTrack.ILine): string =>
          `${planned.line}:${planned.actor}:${planned.startFrame}-${planned.endFrame}`,
      ),
    ],
    [24, ["ana-1:actor-ana:2-6", "ben-1:actor-ben:8-9"]],
  );
  const [ana, ben]: IAutoMovieDialogueMouthTrack.ILine[] = track.lines;
  TestValidator.predicate(
    "the jaw follows each frame's own level",
    ana !== undefined &&
      ana.jaw.length === 4 &&
      ana.jaw[0] === 0 &&
      ana.jaw[3] === 0 &&
      ana.jaw[2]! > 0 &&
      ana.jaw[1]! <= 12 &&
      nclose(ana.jaw[1]! - ana.jaw[2]!, 6, 1e-4),
  );
  TestValidator.equals(
    "the phonemes take one frame each on the emission clock",
    ana?.ranges,
    [
      { startFrame: 2, endFrame: 3, viseme: "aa" },
      { startFrame: 3, endFrame: 4, viseme: "PP" },
      { startFrame: 4, endFrame: 5, viseme: "aa" },
    ],
  );
  TestValidator.predicate(
    "a line without chunks carries only its jaw",
    ben !== undefined &&
      ben.ranges === null &&
      ben.jaw.length === 1 &&
      ben.jaw[0]! > 0 &&
      ben.jaw[0]! <= 12,
  );

  // 6. A quieter take of the same line, levelled to the same audio.
  const quiet: IAutoMovieDialogueMouthTrack = await plan({
    ...sound,
    lines: [entry("ana-quiet", 2, "ana")],
  });
  TestValidator.predicate(
    "a take the mix levels to the same audio opens the jaw alike",
    ana !== undefined &&
      quiet.lines[0]?.jaw.length === ana.jaw.length &&
      quiet.lines[0]!.jaw.every((value: number, index: number): boolean =>
        nclose(value, ana.jaw[index]!, 1e-4),
      ),
  );
  TestValidator.predicate(
    "planning is repeatable and a span past the film is refused",
    JSON.stringify(await plan()) === JSON.stringify(track) &&
      (await rejectsError(
        () =>
          admitAutoMovieFilmDialogue({
            sound,
            frameRate,
            totalFrames: 8,
            read,
          }),
        'line "ben-1" speaks until frame 9',
      )),
  );
}
