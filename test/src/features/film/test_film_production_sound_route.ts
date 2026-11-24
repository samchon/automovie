import {
  masterProductionSound,
  productionSpeechEndFrame,
  renderProductionSound,
} from "@automovie/engine";
import { admitProductionTtsReceipt } from "@automovie/ingest";
import type {
  IAutoMovieCaptureSubject,
  IAutoMovieDrawnVideoResult,
  IAutoMovieFilmSound,
  IAutoMovieProductionSoundPlan,
  IAutoMovieRenderSpec,
} from "@automovie/interface";
import {
  AutoMovieDrawSession,
  renderAutoMovieDrawnVideo,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { answerDrawCall } from "../draw/answerDrawCall";
import { createDrawPageDouble } from "../draw/createDrawPageDouble";
import { createDialogueReceiptFixture } from "../internal/createDialogueReceiptFixture";
import { rejectsError } from "../internal/predicates";

/** One render's result with what the doubles recorded. */
interface IRendered {
  /** The drawn video's result. */
  result: IAutoMovieDrawnVideoResult;

  /** The files the render wrote, by path. */
  written: Map<string, Uint8Array>;

  /** The encoder's arguments. */
  args: readonly string[];

  /** How many frames the page double drew. */
  draws: number;
}

/**
 * A drawn subject's sound list travels to the render, is read through the host,
 * admitted, mixed and encoded as the film's soundtrack.
 *
 * Scenarios:
 *
 * 1. An in-memory host serves two bound lines, at 24 kHz and 16 kHz, and one music
 *    cue; the render writes `frames/soundtrack.wav` before the first frame and
 *    names it as the encoder's second input.
 * 2. The WAV decodes to `renderProductionSound`'s master within 1.5/32768 per
 *    sample, the bound of the encoder's round(x × 32767) read back at 1/32768.
 * 3. The result reports the WAV's digest and each line's receipt PCM digest, and a
 *    second render writes identical WAV bytes.
 * 4. A missing PCM path, a duplicate line id and a subject that declares both a
 *    sound list and a soundtrack are refused before any frame is drawn.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the served files, the written and encoded soundtrack, the decode bound, the report and the refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Drives `renderAutoMovieDrawnVideo` through a draw session over a page double with recording read, write and encode functions. A route that skipped admission, mixed another plan, wrote another soundtrack or encoded without it fails.
 * @evidence contracts/development/testing.md#independent-expectations The expected master comes from the engine mixer on a plan the test builds from the list and the span rule; the bound follows the 16-bit quantization, and the WAV is parsed here from its RIFF layout.
 * @evidence contracts/development/testing.md#distinguishing-cases Pairs the admitted list with three refused variants, one cause each; receipt field refusals belong to `test_ingest_sound_receipt_admission`.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through `test_film_production_sound_route`; the page, files and encoder are doubles and nothing is launched.
 */
export async function test_film_production_sound_route(): Promise<void> {
  const files: Map<string, Uint8Array> = new Map();
  const tone: (length: number, rate: number, hz: number) => Float32Array = (
    length: number,
    rate: number,
    hz: number,
  ): Float32Array =>
    Float32Array.from(
      { length },
      (_: unknown, index: number): number =>
        0.25 * Math.sin((2 * Math.PI * hz * index) / rate),
    );
  const line: (
    id: string,
    text: string,
    samples: Float32Array,
    rate: number,
  ) => void = (
    id: string,
    text: string,
    samples: Float32Array,
    rate: number,
  ): void => {
    const fixture: ReturnType<typeof createDialogueReceiptFixture> =
      createDialogueReceiptFixture({
        line: id,
        text,
        samples,
        sampleRate: rate,
      });
    files.set(`lines/${id}.wav`, fixture.pcm);
    files.set(`lines/${id}.json`, fixture.receiptBytes);
  };
  line("ana-1", "Over here.", tone(6000, 24_000, 180), 24_000);
  line("ben-1", "Coming.", tone(3200, 16_000, 120), 16_000);
  files.set(
    "music/theme.wav",
    createDialogueReceiptFixture({
      line: "theme",
      text: "theme",
      samples: tone(48_000, 48_000, 330),
      sampleRate: 48_000,
    }).pcm,
  );

  const sound: IAutoMovieFilmSound = {
    lines: [
      {
        id: "ana-1",
        text: "Over here.",
        language: "en",
        speaker: "ana",
        startFrame: 2,
        pcm: "lines/ana-1.wav",
        receipt: "lines/ana-1.json",
      },
      {
        id: "ben-1",
        text: "Coming.",
        language: "en",
        speaker: "ben",
        startFrame: 12,
        pcm: "lines/ben-1.wav",
        receipt: "lines/ben-1.json",
      },
    ],
    cues: [
      {
        id: "theme",
        asset: "music/theme.wav",
        sourceDurationFrames: 24,
        sourceOffsetFrame: 0,
        startFrame: 0,
        durationFrames: 24,
        gain: 0.5,
        fadeInFrames: 0,
        fadeOutFrames: 0,
        bus: "music",
      },
    ],
    speakers: [
      { speaker: "ana", actor: "actor-ana" },
      { speaker: "ben", actor: "actor-ben" },
    ],
    scoreDucking: { gain: 0.5, attackFrames: 1, releaseFrames: 2 },
  };
  const subject: (
    extra: Partial<IAutoMovieCaptureSubject>,
  ) => IAutoMovieCaptureSubject = (
    extra: Partial<IAutoMovieCaptureSubject>,
  ): IAutoMovieCaptureSubject => ({
    name: "film",
    durationSeconds: 1,
    fps: 24,
    width: 16,
    height: 10,
    views: [],
    drawables: [],
    marks: [],
    sound,
    ...extra,
  });
  const spec: Omit<IAutoMovieRenderSpec, "frameFormat"> = {
    target: "production",
    toneMapping: "none",
    codec: "h264",
    pixelFormat: "yuv420p",
    crf: 18,
  };
  const render: (
    described: IAutoMovieCaptureSubject,
    audio?: string | null,
  ) => Promise<IRendered> = async (
    described: IAutoMovieCaptureSubject,
    audio: string | null = null,
  ): Promise<IRendered> => {
    const double: createDrawPageDouble.IDouble = createDrawPageDouble({
      subject: described,
      renderer: "test",
      answer: answerDrawCall,
    });
    const session: AutoMovieDrawSession = await AutoMovieDrawSession.open({
      page: double.page,
      url: "http://127.0.0.1:1/render/index.html",
      props: { subject: described.name, props: null },
      backend: "swiftshader",
      timeout: 1000,
    });
    const written: Map<string, Uint8Array> = new Map();
    let args: readonly string[] = [];
    let draws: number = 0;
    const result: IAutoMovieDrawnVideoResult = await renderAutoMovieDrawnVideo({
      session: {
        subject: session.subject,
        frame: async (...call: Parameters<AutoMovieDrawSession["frame"]>) => {
          ++draws;
          return session.frame(...call);
        },
        speak: (track) => session.speak(track),
      },
      spec,
      frameDir: "frames",
      outputPath: "film.mp4",
      audio,
      write: async (path: string, data: Uint8Array): Promise<void> => {
        written.set(path, data);
      },
      read: async (path: string): Promise<Uint8Array> => {
        const bytes: Uint8Array | undefined = files.get(path);
        if (bytes === undefined) throw new Error(`ENOENT ${path}`);
        return bytes;
      },
      encode: async (encoderArgs: readonly string[]): Promise<void> => {
        args = encoderArgs;
      },
    });
    return { result, written, args, draws };
  };

  const first: IRendered = await render(subject({}));
  const second: IRendered = await render(subject({}));
  const wav: Uint8Array = first.written.get("frames/soundtrack.wav")!;
  const inputs: string[] = first.args.flatMap(
    (value: string, index: number): string[] =>
      first.args[index - 1] === "-i" ? [value] : [],
  );
  TestValidator.predicate(
    "the soundtrack is written and encoded as the second input",
    wav !== undefined &&
      inputs.length === 2 &&
      inputs[1] === "frames/soundtrack.wav",
  );

  // The expected master: the same lines admitted and placed by the span rule.
  const admitted: ReturnType<typeof admitProductionTtsReceipt>[] =
    sound.lines.map((entry: IAutoMovieFilmSound.ILine) =>
      admitProductionTtsReceipt({
        line: entry,
        pcmPath: entry.pcm,
        pcm: files.get(entry.pcm)!,
        receiptPath: entry.receipt,
        receipt: files.get(entry.receipt)!,
        sampleRate: 48_000,
      }),
    );
  const plan: IAutoMovieProductionSoundPlan = {
    version: 1,
    inputFingerprint: "expected",
    fps: 24,
    frameRate: { numerator: 24, denominator: 1 },
    totalFrames: 24,
    sampleRate: 48_000,
    channels: 2,
    scoreDucking: sound.scoreDucking,
    events: [],
    cues: sound.cues.map((cue) => ({ ...cue, seed: 0 })),
    dialogue: sound.lines.map((entry, index) => ({
      id: entry.id,
      text: entry.text,
      language: entry.language,
      speaker: entry.speaker!,
      startFrame: entry.startFrame,
      endFrame: productionSpeechEndFrame(
        { fps: 24, sampleRate: 48_000 },
        entry.startFrame,
        admitted[index]!.audio.samples.length,
      ),
    })),
  };
  // The written soundtrack is the mix after the master stage, as the render
  // mixer delivers it.
  const master: Float32Array = masterProductionSound({
    plan,
    rendered: renderProductionSound({
      plan,
      dialogue: new Map(
        admitted.map((entry) => [entry.receipt.line, entry.audio.samples]),
      ),
      assets: new Map([
        [
          "music/theme.wav",
          tone(48_000, 48_000, 330).map((x: number): number => Math.fround(x)),
        ],
      ]),
    }),
  }).pcm;
  const view: DataView = new DataView(
    wav.buffer,
    wav.byteOffset,
    wav.byteLength,
  );
  const frames: number = view.getUint32(40, true) / 4;
  let worst: number = 0;
  for (let index: number = 0; index < frames * 2; ++index)
    worst = Math.max(
      worst,
      Math.abs(view.getInt16(44 + index * 2, true) / 32768 - master[index]!),
    );
  TestValidator.predicate(
    "the soundtrack decodes to the engine master",
    frames === 48_000 && master.length === 96_000 && worst <= 1.5 / 32768,
  );

  const report: IAutoMovieDrawnVideoResult["sound"] = first.result.sound;
  const secondWav: Uint8Array = second.written.get("frames/soundtrack.wav")!;
  TestValidator.predicate(
    "the report carries the digests and a second render repeats the bytes",
    report !== undefined &&
      /^sha256:[0-9a-f]{64}$/.test(report.sha256) &&
      report.receipts.map((entry) => entry.line).join() === "ana-1,ben-1" &&
      report.receipts.every(
        (entry, index) =>
          entry.pcmDigest === admitted[index]!.receipt.pcmDigest,
      ) &&
      secondWav.length === wav.length &&
      secondWav.every(
        (byte: number, index: number): boolean => byte === wav[index],
      ),
  );

  // Refusals, each before any frame is drawn.
  const refusals: [string, IAutoMovieCaptureSubject, string | null, string][] =
    [
      [
        "missing pcm",
        subject({
          sound: {
            ...sound,
            lines: [{ ...sound.lines[0]!, pcm: "lines/missing.wav" }],
          },
        }),
        null,
        '"lines/missing.wav"',
      ],
      [
        "duplicate line",
        subject({
          sound: {
            ...sound,
            lines: [sound.lines[0]!, { ...sound.lines[1]!, id: "ana-1" }],
          },
        }),
        null,
        'line id "ana-1"',
      ],
      [
        "sound list and soundtrack",
        subject({}),
        "media/soundtrack.wav",
        "both a sound list and the soundtrack",
      ],
    ];
  const accepted: string[] = [];
  for (const [label, described, audio, message] of refusals)
    if ((await rejectsError(() => render(described, audio), message)) === false)
      accepted.push(label);
  TestValidator.equals("refused sound lists", accepted, []);
}
