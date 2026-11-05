import {
  type IAutoMovieHeadlessPage,
  planViewerFrameTimes,
} from "@automovie/render";
import {
  type IAutoMovieViewerVideoResult,
  renderViewerFrames,
  renderViewerVideo,
} from "@automovie/render/node";
import { DEFAULT_CHROME_EXECUTABLE } from "@automovie/render/node/chrome";
import ffmpeg from "ffmpeg-static";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

import type { IFilm } from "../IFilm";
import { films } from "../films";
import { FilmExportPlan } from "../runtime/export/FilmExportPlan";
import { decodeFilm } from "../runtime/export/decodeFilm";
import { selectFilm } from "../selectFilm";
import { FilmPlan } from "../shots/kickboxing/ring-bout/FilmPlan";
import type { AudioMix } from "../sound/AudioMix";
import { renderFilmAudioMix } from "../sound/renderFilmAudioMix";

/**
 * Export one film of the inspected Viewer as a video with its actual contacts and
 * identical soundtrack, or as stills of chosen frames.
 *
 * @evidence contracts/common.md#implementation-and-ownership Public Render owns one browser, completed seek captures at i/30, encoding and frame-scratch cleanup. This caller owns a fresh exclusive audio scratch directory, removed after success, failure or cancellation without touching prior paths. Same-page preparation reads actual full-timeline events, contact receipts and audio identity, then shared AudioMix writes byte-identical WAV. Actual foot landings and attack onsets replace nominal timing in both consumers; identity mismatch refuses before capture. Final decode checks all 5400 video frames, audio samples and exact 180-second presentations. Failed final artifacts remain distinguishable by the rejected command and available receipts; only the temporary WAV is always released.
 * @evidence contracts/common.md#authoring-interface Run pnpm render --film kickboxing with an optional inspected local Viewer URL (VIEWER_URL or port 5199 by default) to write media/automovie/<film>/videos/<film>.mp4, or --out <dir>; adding --at seconds or a --from/--to range with --every frames or --step seconds writes those frames as stills to media/automovie/<film>/frames/ or --out instead. CHROME_PATH/CHROME, FFMPEG_PATH and FFPROBE_PATH may override installed executables. Sidecars retain source URL, actual contacts/audio identity, capture and encode timings and complete decode receipts. The command grants no picture, listening or physical acceptance.
 */
export async function render(): Promise<void> {
  /** Serializable facts read from the actual capture page, including fixed audio identity. */
  type Observation = {
    ready: boolean;
    durationSeconds: number;
    fps: number;
    frameCount: number;
    eventCount: number;
    events: FilmPlan.Event[];
    contacts: AudioMix.Contact[];
    floorContacts: AudioMix.FloorContact[];
    audio: { sha256: string; cueDigest: string; assets: unknown };
    inspection: unknown;
  };

  /** Public methods on the prepared host; their results cross the evaluation transport. */
  type Host = Omit<
    Observation,
    "events" | "contacts" | "floorContacts" | "audio" | "inspection"
  > & {
    audioEvents: () => Observation["events"];
    contacts: () => Observation["contacts"];
    floorContacts: () => Observation["floorContacts"];
    audioManifest: () => Observation["audio"];
    inspect: () => unknown;
  };

  // Options select the film and, for stills, their frames; a lone positional
  // argument names the inspected Viewer URL.
  const options: Map<string, string> = new Map();
  const positional: string[] = [];
  const argv: string[] = process.argv.slice(2);
  for (let index: number = 0; index < argv.length; index++) {
    const [key, inline] = argv[index]!.split(/=(.*)/s) as [string, string?];
    if (!key.startsWith("--")) {
      positional.push(argv[index]!);
      continue;
    }
    if (
      ![
        "--film",
        "--at",
        "--from",
        "--to",
        "--every",
        "--step",
        "--out",
      ].includes(key)
    )
      throw new Error(`Unknown option ${key}`);
    const value: string | undefined = inline ?? argv[++index];
    if (value === undefined || value === "")
      throw new Error(`${key} needs a value`);
    options.set(key, value);
  }
  if (positional.length > 1)
    throw new Error("Give at most one Viewer URL; use --out for the folder");
  const number: (key: string) => number | undefined = (
    key: string,
  ): number | undefined =>
    options.has(key) ? Number(options.get(key)) : undefined;
  const selected: { name: string; film: IFilm } = selectFilm(
    films,
    options.get("--film") ?? null,
  );
  const film: string = selected.name;
  const url: string = FilmExportPlan.url(
    positional[0] ?? process.env.VIEWER_URL ?? "http://127.0.0.1:5199/",
    film,
  );

  // Any frame option asks for stills of those frames instead of the video.
  if (
    ["--at", "--from", "--to", "--every", "--step"].some(
      (key: string): boolean => options.has(key),
    )
  ) {
    const stills: { file: string }[] = await renderViewerFrames({
      url,
      width: 1280,
      height: 720,
      fps: selected.film.fps,
      times: planViewerFrameTimes({
        fps: selected.film.fps,
        durationSeconds: selected.film.durationSeconds,
        at: options.get("--at")?.split(",").map(Number),
        from: number("--from"),
        to: number("--to"),
        every: number("--every"),
        step: number("--step"),
      }),
      outputDir: options.get("--out") ?? `media/automovie/${film}/frames`,
      chromeExecutable:
        process.env.CHROME_PATH ??
        process.env.CHROME ??
        DEFAULT_CHROME_EXECUTABLE,
      seekFunction: "__afSeek",
    });
    for (const still of stills) console.log(still.file);
    return;
  }
  const outputPath: string = path.resolve(
    options.get("--out") ?? `media/automovie/${film}/videos`,
    `${film}.mp4`,
  );
  const ffmpegExecutable: string = process.env.FFMPEG_PATH ?? ffmpeg ?? "";
  const ffprobeExecutable: string =
    process.env.FFPROBE_PATH ??
    (createRequire(import.meta.url)("ffprobe-static") as { path: string }).path;
  if (ffmpegExecutable.length === 0 || ffprobeExecutable.length === 0)
    throw new Error("Installed FFmpeg and FFprobe executables are required");
  await mkdir(path.dirname(outputPath), { recursive: true });
  const frameDir: string = path.resolve(`.cache/render/${film}`);
  await mkdir(frameDir, { recursive: true });
  const audioScratch: string = await mkdtemp(
    path.join(frameDir, "film-audio-"),
  );
  let audio: Awaited<ReturnType<typeof renderFilmAudioMix>> | undefined;
  let audioEvents: readonly FilmPlan.Event[] | undefined;
  let contactReceipts: readonly AudioMix.Contact[] | undefined;
  let floorContactReceipts: readonly AudioMix.FloorContact[] | undefined;
  let viewerObservation: unknown;
  let failure: { error: unknown } | undefined;
  const controller: AbortController = new AbortController();
  const abort: () => void = (): void =>
    controller.abort(new Error("Film export interrupted"));
  process.once("SIGINT", abort);
  process.once("SIGTERM", abort);
  try {
    const result: IAutoMovieViewerVideoResult = await renderViewerVideo({
      url,
      durationSeconds: FilmPlan.duration,
      frameDir,
      outputPath,
      chromeExecutable: process.env.CHROME_PATH ?? DEFAULT_CHROME_EXECUTABLE,
      ffmpegExecutable,
      spec: {
        target: "kickboxing",
        frameFormat: { fps: FilmPlan.fps, width: 1280, height: 720 },
        toneMapping: "none",
        codec: "h264",
        pixelFormat: "yuv420p",
        crf: 18,
      },
      viewSelector: "#view",
      hideSelector: null,
      maxFrames: FilmPlan.frames,
      signal: controller.signal,
      prepare: async (
        page: Pick<IAutoMovieHeadlessPage, "evaluate">,
      ): Promise<{ audioMix: string }> => {
        const observed: unknown = await page.evaluate(
          async (): Promise<unknown> => {
            const globals: Record<string, unknown> =
              globalThis as unknown as Record<string, unknown>;
            const seek: unknown = globals.__afSeek;
            if (typeof seek !== "function")
              throw new Error("Viewer completed seek hook is unavailable");
            await seek(0);
            const host: Host = globals.__kickboxingFilm as Host;
            if (!host || !host.ready)
              throw new Error(
                "Whole-film runtime and soundtrack are not prepared",
              );
            return {
              ready: host.ready,
              durationSeconds: host.durationSeconds,
              fps: host.fps,
              frameCount: host.frameCount,
              eventCount: host.eventCount,
              events: host.audioEvents(),
              contacts: host.contacts(),
              floorContacts: host.floorContacts(),
              audio: host.audioManifest(),
              inspection: host.inspect(),
            };
          },
          null,
        );
        if (observed === null || typeof observed !== "object")
          throw new Error("Viewer preparation returned no observation");
        const host: Observation = observed as Observation;
        FilmExportPlan.assertClock(host);
        if (
          !Array.isArray(host.events) ||
          host.events.length === 0 ||
          host.eventCount !== host.events.length ||
          !Array.isArray(host.contacts) ||
          !Array.isArray(host.floorContacts) ||
          !host.audio
        )
          throw new Error("Viewer programme or audio manifest is incomplete");
        audioEvents = host.events;
        contactReceipts = host.contacts;
        floorContactReceipts = host.floorContacts;
        viewerObservation = host.inspection;
        audio = await renderFilmAudioMix({
          events: audioEvents,
          contacts: contactReceipts,
          floorContacts: floorContactReceipts,
          outputPath: path.join(audioScratch, "mix.wav"),
        });
        if (
          audio.sha256 !== host.audio.sha256 ||
          audio.cueDigest !== host.audio.cueDigest ||
          JSON.stringify(audio.assets) !== JSON.stringify(host.audio.assets)
        )
          throw new Error(
            "Viewer and exported soundtrack bytes or cue/source identities differ",
          );
        return { audioMix: audio.path };
      },
      onProgress: (progress: {
        index: number;
        timeSeconds: number;
        bytes: number;
      }): void => {
        if (progress.index % 150 === 0) console.log(JSON.stringify(progress));
      },
    });
    await writeFile(
      `${outputPath}.capture.json`,
      JSON.stringify(
        {
          url,
          clock: {
            durationSeconds: FilmPlan.duration,
            fps: FilmPlan.fps,
            frameCount: FilmPlan.frames,
          },
          audio:
            audio === undefined
              ? undefined
              : {
                  ...audio,
                  path: undefined,
                  inputLifetime:
                    "Exclusive temporary WAV, released by the export operation's finally block",
                },
          audioEvents,
          contactReceipts,
          floorContactReceipts,
          viewerObservation,
          result,
          review:
            "Capture and decoding do not establish picture, listening or physical acceptance",
        },
        null,
        2,
      ),
    );
    await decodeFilm({
      outputPath,
      ffmpegExecutable,
      ffprobeExecutable,
      frameCount: FilmPlan.frames,
      fps: FilmPlan.fps,
      width: 1280,
      height: 720,
      signal: controller.signal,
    });
  } catch (error: unknown) {
    failure = { error };
    throw error;
  } finally {
    process.removeListener("SIGINT", abort);
    process.removeListener("SIGTERM", abort);
    try {
      await rm(audioScratch, { recursive: true });
    } catch (cleanup: unknown) {
      throw new AggregateError(
        [...(failure === undefined ? [] : [failure.error]), cleanup],
        "Film audio scratch cleanup failed",
      );
    }
  }
  console.log(outputPath);
}

void render().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
