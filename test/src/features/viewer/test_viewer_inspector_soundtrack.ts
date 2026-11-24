import type { IAutoMovieFilmSound } from "@automovie/interface";
import { mixAutoMovieFilmSound } from "@automovie/render";
import {
  AutoMovieInspectorPlayhead,
  type IAutoMovieInspectorSceneHost,
  syncAutoMovieInspectorSoundtrack,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

import { createDialogueReceiptFixture } from "../internal/createDialogueReceiptFixture";

/**
 * The inspector plays the master its subject's delivery encodes, in step with
 * the playhead, instead of mixing cues of its own.
 *
 * Scenarios:
 *
 * 1. A one-second 24 fps subject with one adopted line: the bytes the host is
 *    asked to decode are the WAVE master `mixAutoMovieFilmSound` writes for the
 *    delivery from the same sound list and clock.
 * 2. Playing from 0 s starts the master at 0 s and rate 1; seeking to 0.5 s while
 *    playing restarts it there; a rate of 0.5 restarts it at 0.5; advancing the
 *    playhead alone restarts nothing; pausing stops it.
 * 3. The release stops listening: a later play starts nothing, and the master is
 *    disposed.
 * 4. A sound list whose line file is missing reports the refusal naming the path
 *    and decodes nothing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists each playhead change and the master calls it must give.
 * @evidence contracts/development/testing.md#behavioral-verification Runs `syncAutoMovieInspectorSoundtrack` with a real playhead and a recording host and reads the bytes and calls; a viewer that mixed its own cues, restarted on every frame, ignored a seek or rate change, or kept playing after release fails.
 * @evidence contracts/development/testing.md#independent-expectations #4051 item 8 requires the viewer to play the master the delivery encodes, which is `mixAutoMovieFilmSound`'s WAVE output for the same list and clock; the start seconds and rates are the playhead's own.
 * @evidence contracts/development/testing.md#distinguishing-cases Pairs a play, a seek, a rate change and an advance that must not restart, a pause, a release and a refused mix; Web Audio playback itself belongs to `playAutoMovieSoundtrack` under a browser.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through `test_viewer_inspector_soundtrack`; the host is a double and no browser or audio device starts.
 */
export async function test_viewer_inspector_soundtrack(): Promise<void> {
  const fixture: ReturnType<typeof createDialogueReceiptFixture> =
    createDialogueReceiptFixture({
      line: "ana-1",
      text: "Hello.",
      samples: Float32Array.from(
        { length: 24_000 },
        (_: unknown, index: number): number =>
          0.1 * Math.sin((2 * Math.PI * 220 * index) / 48_000),
      ),
      sampleRate: 48_000,
    });
  const files: Map<string, Uint8Array> = new Map([
    ["lines/ana-1.wav", fixture.pcm],
    ["lines/ana-1.json", fixture.receiptBytes],
  ]);
  const sound: IAutoMovieFilmSound = {
    lines: [
      {
        id: "ana-1",
        text: "Hello.",
        language: "en",
        startFrame: 0,
        pcm: "lines/ana-1.wav",
        receipt: "lines/ana-1.json",
      },
    ],
    cues: [],
    speakers: [],
  };
  const read: (path: string) => Promise<Uint8Array> = async (
    path: string,
  ): Promise<Uint8Array> => {
    const bytes: Uint8Array | undefined = files.get(path);
    if (bytes === undefined) throw new Error(`ENOENT ${path}`);
    return bytes;
  };

  // A host that records what it is asked to decode and play.
  const calls: string[] = [];
  let decoded: Uint8Array | undefined;
  let loaded: () => void = (): void => {};
  const ready: Promise<undefined> = new Promise<undefined>(
    (resolve: (value: undefined) => void): void => {
      loaded = (): void => resolve(undefined);
    },
  );
  const host: IAutoMovieInspectorSceneHost.ISound = {
    read,
    load: async (
      wav: Uint8Array,
    ): Promise<IAutoMovieInspectorSceneHost.ISoundtrack> => {
      decoded = wav;
      queueMicrotask(loaded);
      return {
        play: (seconds: number, rate: number): void => {
          calls.push(`play ${seconds} ${rate}`);
        },
        stop: (): void => {
          calls.push("stop");
        },
        dispose: (): void => {
          calls.push("dispose");
        },
      };
    },
  };
  const playhead: AutoMovieInspectorPlayhead = new AutoMovieInspectorPlayhead();
  playhead.setDuration(1);
  const errors: string[] = [];
  const release: () => void = syncAutoMovieInspectorSoundtrack({
    instance: { sound, fps: 24, durationSeconds: 1 },
    sound: host,
    playhead,
    error: (message: string): void => {
      errors.push(message);
    },
  });
  await ready;

  // 1. The delivered master.
  const delivered: Uint8Array = (
    await mixAutoMovieFilmSound({
      sound,
      frameRate: { numerator: 24, denominator: 1 },
      totalFrames: 24,
      read,
    })
  ).wav;
  TestValidator.predicate(
    "the host decodes the delivery's master",
    decoded !== undefined &&
      decoded.length === delivered.length &&
      decoded.every(
        (byte: number, index: number): boolean => byte === delivered[index],
      ),
  );

  // 2. The playhead drives it.
  calls.length = 0;
  playhead.play();
  playhead.seek(0.5);
  playhead.setRate(0.5);
  playhead.advance(0.1);
  playhead.pause();
  TestValidator.equals("playback follows each audible playhead change", calls, [
    "stop",
    "play 0 1",
    "stop",
    "play 0.5 1",
    "stop",
    "play 0.5 0.5",
    "stop",
  ]);

  // 3. Released.
  calls.length = 0;
  release();
  playhead.play();
  TestValidator.equals("a released master is silent", calls, ["dispose"]);

  // 4. A refused mix.
  const refused: string[] = [];
  syncAutoMovieInspectorSoundtrack({
    instance: {
      sound: {
        ...sound,
        lines: [{ ...sound.lines[0]!, pcm: "lines/missing.wav" }],
      },
      fps: 24,
      durationSeconds: 1,
    },
    sound: {
      read,
      load: async (): Promise<IAutoMovieInspectorSceneHost.ISoundtrack> => {
        throw new Error("nothing should be decoded");
      },
    },
    playhead: new AutoMovieInspectorPlayhead(),
    error: (message: string): void => {
      refused.push(message);
    },
  });
  await new Promise<undefined>((resolve: (value: undefined) => void): void => {
    setTimeout((): void => resolve(undefined), 50);
  });
  TestValidator.predicate(
    "a refused mix is reported by path",
    errors.length === 0 &&
      refused.length === 1 &&
      refused[0]!.includes("lines/missing.wav"),
  );
}
