import type {
  IAutoMovieCaptureSubject,
  IAutoMovieDialogueLipSync,
  IAutoMovieDialogueMouthTrack,
  IAutoMovieDrawnVideoResult,
  IAutoMovieFilmSound,
  IAutoMovieProductionPhonemeChunk,
} from "@automovie/interface";
import {
  AutoMovieDialogueMouthRecorder,
  AutoMovieDrawSession,
  renderAutoMovieDrawnVideo,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { createDialogueReceiptFixture } from "../../../internal/createDialogueReceiptFixture";
import { answerDrawCall } from "./answerDrawCall";
import { createDrawPageDouble } from "./createDrawPageDouble";

/**
 * A drawn film's speakers are handed their mouths before the first frame, and
 * each line's lip sync is measured on the mouths the subject read on the drawn
 * frames.
 *
 * Scenarios:
 *
 * 1. Three phoneme-driven lines bound to three actors at 24 fps: the session hands
 *    the page the track of all three before it draws the first frame.
 * 2. A subject that reads `actor-ana`'s visemes at each drawn second passes with a
 *    lag of 0 frames.
 * 3. A subject that reads them three frames late (125 ms) fails with a lag of −3
 *    frames: the sound leads the drawn mouth by more than 45 ms, though the
 *    track itself is on time.
 * 4. `actor-ben`, whose figure reads only the jaw, is `envelope-jaw`, and
 *    `actor-cal`, whose mouth the subject never reads, is `mouth-not-drawn`.
 * 5. A transparent layer writes no soundtrack and reports no sound, but its
 *    subject is still handed the same track.
 */
export async function test_unit_render_draw_drawn_video_mouths(): Promise<void> {
  // /a m a m a/ at 48 kHz over 6, 2, 3, 4 and 2 frames of 2000 samples; the
  // vowels are loud and the bilabial hum quiet.
  const chunks: IAutoMovieProductionPhonemeChunk[] = [
    [0, 12_000, "a"],
    [12_000, 16_000, "m"],
    [16_000, 22_000, "a"],
    [22_000, 30_000, "m"],
    [30_000, 34_000, "a"],
  ].map(([startSample, endSample, phonemes]: (number | string)[]) => ({
    phonemes: phonemes as string,
    startSample: startSample as number,
    endSample: endSample as number,
  }));
  const samples: Float32Array = Float32Array.from(
    { length: 34_000 },
    (_: unknown, index: number): number => {
      const vowel: boolean = chunks.some(
        (chunk: IAutoMovieProductionPhonemeChunk): boolean =>
          chunk.phonemes === "a" &&
          index >= chunk.startSample &&
          index < chunk.endSample,
      );
      return (
        (vowel ? 0.1 : 0.01) * Math.sin((2 * Math.PI * 220 * index) / 48_000)
      );
    },
  );
  const files: Map<string, Uint8Array> = new Map();
  const speakers: string[] = ["ana", "ben", "cal"];
  for (const speaker of speakers) {
    const fixture: ReturnType<typeof createDialogueReceiptFixture> =
      createDialogueReceiptFixture({
        line: `${speaker}-1`,
        text: "A ma ma.",
        samples,
        sampleRate: 48_000,
        phonemeChunks: chunks,
      });
    files.set(`lines/${speaker}-1.wav`, fixture.pcm);
    files.set(`lines/${speaker}-1.json`, fixture.receiptBytes);
  }
  const sound: IAutoMovieFilmSound = {
    lines: speakers.map(
      (speaker: string, index: number): IAutoMovieFilmSound.ILine => ({
        id: `${speaker}-1`,
        text: "A ma ma.",
        language: "en",
        speaker,
        startFrame: 8 + index * 2,
        pcm: `lines/${speaker}-1.wav`,
        receipt: `lines/${speaker}-1.json`,
      }),
    ),
    cues: [],
    speakers: speakers.map((speaker: string) => ({
      speaker,
      actor: `actor-${speaker}`,
    })),
  };
  const subject: IAutoMovieCaptureSubject = {
    name: "film",
    durationSeconds: 2,
    fps: 24,
    width: 16,
    height: 10,
    views: [],
    drawables: [],
    marks: [],
    sound,
  };

  // The subject's seek: ana's visemes `late` frames behind the drawn second,
  // ben's jaw, and nothing for cal.
  const render: (
    late: number,
    transparent?: boolean,
  ) => Promise<{
    result: IAutoMovieDrawnVideoResult;
    calls: createDrawPageDouble.ICall[];
  }> = async (
    late: number,
    transparent: boolean = false,
  ): Promise<{
    result: IAutoMovieDrawnVideoResult;
    calls: createDrawPageDouble.ICall[];
  }> => {
    let recorder: AutoMovieDialogueMouthRecorder | null = null;
    const double: createDrawPageDouble.IDouble = createDrawPageDouble({
      subject,
      renderer: "test",
      answer: (call) => {
        recorder ??= new AutoMovieDialogueMouthRecorder(handed(double.calls)!);
        recorder.clear();
        recorder.mouths.visemes("actor-ana", call.seconds - late / 24);
        recorder.mouths.jaw("actor-ben", call.seconds);
        return { ...answerDrawCall(call), mouths: recorder.drawn() };
      },
    });
    const session: AutoMovieDrawSession = await AutoMovieDrawSession.open({
      page: double.page,
      url: "http://127.0.0.1:1/render/index.html",
      props: { subject: subject.name, props: null },
      backend: "swiftshader",
      timeout: 1000,
    });
    const result: IAutoMovieDrawnVideoResult = await renderAutoMovieDrawnVideo({
      session,
      spec: {
        target: "production",
        toneMapping: "none",
        codec: "h264",
        pixelFormat: "yuv420p",
        crf: 18,
      },
      frameDir: "frames",
      outputPath: transparent ? "film.mov" : "film.mp4",
      audio: null,
      write: async (): Promise<void> => {},
      read: async (path: string): Promise<Uint8Array> => {
        const bytes: Uint8Array | undefined = files.get(path);
        if (bytes === undefined) throw new Error(`ENOENT ${path}`);
        return bytes;
      },
      encode: async (): Promise<void> => {},
      ...(transparent ? { background: "transparent" as const } : {}),
    });
    return { result, calls: double.calls };
  };
  const entries: (
    result: IAutoMovieDrawnVideoResult,
  ) => (string | number)[][] = (
    result: IAutoMovieDrawnVideoResult,
  ): (string | number)[][] =>
    (result.sound?.lipSync ?? []).map(
      (entry: IAutoMovieDialogueLipSync): (string | number)[] =>
        entry.status === "measured"
          ? [entry.line, entry.verdict, entry.lagFrames]
          : [entry.line, entry.reason],
    );

  const onTime: Awaited<ReturnType<typeof render>> = await render(0);
  const evaluated: unknown[] = onTime.calls
    .filter(
      (call: createDrawPageDouble.ICall): boolean => call.method === "evaluate",
    )
    .map((call: createDrawPageDouble.ICall): unknown => call.arg);
  const track: IAutoMovieDialogueMouthTrack | undefined = handed(onTime.calls);
  TestValidator.predicate(
    "the track of every bound line is handed before the first frame",
    track !== undefined &&
      track.lines.map((line) => `${line.line}:${line.actor}`).join() ===
        "ana-1:actor-ana,ben-1:actor-ben,cal-1:actor-cal" &&
      evaluated.findIndex((arg: unknown): boolean => isTrack(arg)) === 1 &&
      evaluated.length === 2 + 48,
  );
  TestValidator.equals("an on-time mouth passes", entries(onTime.result), [
    ["ana-1", "pass", 0],
    ["ben-1", "envelope-jaw"],
    ["cal-1", "mouth-not-drawn"],
  ]);
  TestValidator.equals(
    "a mouth drawn three frames late fails though its track is on time",
    entries((await render(3)).result)[0],
    ["ana-1", "fail", -3],
  );

  const layer: Awaited<ReturnType<typeof render>> = await render(0, true);
  TestValidator.predicate(
    "a transparent layer reports no sound but still hands the same track",
    layer.result.sound === undefined &&
      JSON.stringify(handed(layer.calls)) === JSON.stringify(track),
  );
}

/** The mouth track the session handed the page, if it handed one. */
function handed(
  calls: readonly createDrawPageDouble.ICall[],
): IAutoMovieDialogueMouthTrack | undefined {
  const arg: unknown = calls.find(
    (call: createDrawPageDouble.ICall): boolean =>
      call.method === "evaluate" && isTrack(call.arg),
  )?.arg;
  return isTrack(arg) ? arg.track : undefined;
}

/** Whether a page call's argument hands a mouth track. */
function isTrack(arg: unknown): arg is { track: IAutoMovieDialogueMouthTrack } {
  return typeof arg === "object" && arg !== null && "track" in arg;
}
