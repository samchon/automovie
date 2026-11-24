import type {
  IAutoMovieCaptureSubject,
  IAutoMovieDialogueLipSync,
  IAutoMovieDialogueMouth,
  IAutoMovieDialogueMouthTrack,
  IAutoMovieDrawnVideoResult,
  IAutoMovieFilmSound,
  IAutoMovieProductionPhonemeChunk,
} from "@automovie/interface";
import {
  AutoMovieDialogueMouthStage,
  AutoMovieDrawSession,
  bindAutoMovieDialogueMouth,
  renderAutoMovieDrawnVideo,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createDialogueReceiptFixture } from "../internal/createDialogueReceiptFixture";
import { answerDrawCall } from "./answerDrawCall";
import { createDrawPageDouble } from "./createDrawPageDouble";

/**
 * A drawn film's speakers are handed their mouths before the first frame, and
 * each line's lip sync is measured on the mouths the figures showed on the
 * drawn frames.
 *
 * Scenarios:
 *
 * 1. Three phoneme-driven lines bound to three actors at 24 fps: the session hands
 *    the page the track of all three before it draws the first frame.
 * 2. A figure of `actor-ana` that shows each viseme mouth as it is handed passes
 *    with a lag of 0 frames.
 * 3. A figure that shows each mouth three frames after it is handed it (125 ms)
 *    fails with a lag of −3 frames: the sound leads the drawn mouth by more
 *    than 45 ms, though the track itself is on time.
 * 4. `actor-ben`, whose figure shows only the jaw, is `envelope-jaw`, and
 *    `actor-cal`, whose node holds no figure, is `mouth-not-drawn`, although
 *    the page handed its mouth on every frame.
 * 5. A transparent layer writes no soundtrack and reports no sound, but its page
 *    is still handed the same track.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the lines, what each actor's figure shows, and the entry each must give.
 * @evidence contracts/development/testing.md#behavioral-verification Drives `renderAutoMovieDrawnVideo` through a draw session over a page double that shows the handed track on bound figures through `AutoMovieDialogueMouthStage`, as `installAutoMovieDraw` does after each placement. A route that measured a series recomputed from the track would pass the late figure; one that never handed the track, measured a jaw-driven figure, or measured a mouth no figure drew, fails.
 * @evidence contracts/development/testing.md#independent-expectations The late figure shows each mouth three frames after its sound, which is a lag of −3 frames or −125 ms at 24 fps, outside ITU-R BT.1359-1's −45 ms limit; an on-time mouth has lag 0. The phoneme durations are irregular, so no other lag in the ±6-frame window repeats the pattern.
 * @evidence contracts/development/testing.md#distinguishing-cases Pairs an on-time and a late viseme figure, a jaw-driven figure and a node without one, and an opaque and a transparent render; the lag arithmetic belongs to `test_engine_lip_sync_lag`, the figures render drives to `test_draw_dialogue_mouth_stage` and the publication gate to `test_cli_render_video_lip_sync`.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through `test_draw_drawn_video_mouths`; the page, files and encoder are doubles and nothing is launched.
 */
export async function test_draw_drawn_video_mouths(): Promise<void> {
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

  // The page's figures: ana's shows each mouth `late` showings after it is
  // handed it, ben's draws the jaw, and cal's node holds no figure.
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
    const root: THREE.Scene = new THREE.Scene();
    const figure: (actor: string) => THREE.Object3D = (
      actor: string,
    ): THREE.Object3D => {
      const node: THREE.Group = new THREE.Group();
      node.name = actor;
      const body: THREE.Group = new THREE.Group();
      node.add(body);
      root.add(node);
      return body;
    };
    const handedToAna: (IAutoMovieDialogueMouth | null)[] = [];
    bindAutoMovieDialogueMouth(figure("actor-ana"), {
      show: (mouth: IAutoMovieDialogueMouth | null) => {
        handedToAna.push(mouth);
        const shown: IAutoMovieDialogueMouth | null | undefined =
          handedToAna[handedToAna.length - 1 - late];
        return shown === null || shown === undefined
          ? null
          : { visemes: { ...shown.visemes } };
      },
    });
    bindAutoMovieDialogueMouth(figure("actor-ben"), {
      show: (mouth: IAutoMovieDialogueMouth | null) =>
        mouth === null ? null : { jaw: mouth.jaw },
    });
    figure("actor-cal");
    let stage: AutoMovieDialogueMouthStage | null = null;
    const double: createDrawPageDouble.IDouble = createDrawPageDouble({
      subject,
      renderer: "test",
      answer: (call) => {
        stage ??= new AutoMovieDialogueMouthStage(handed(double.calls)!);
        stage.clear();
        stage.show(root, call.seconds);
        return { ...answerDrawCall(call), mouths: stage.drawn() };
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
