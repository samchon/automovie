import { planViewerFrameTimes } from "@automovie/render";
import {
  decodeAutoMovieDelivery,
  renderViewerFrames,
  renderViewerVideo,
  type IAutoMovieViewerVideoResult,
} from "@automovie/render/node";
import ffmpeg from "ffmpeg-static";
import ffprobe from "ffprobe-static";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { IFilm } from "../IFilm";
import { films } from "../composition/films";
import { selectFilm } from "../selectFilm";

/**
 * Export one film of the running Viewer as a video, or as stills of chosen frames.
 *
 * `npm run render -- --film <name>` writes the whole film to
 * `media/automovie/<film>/videos/film.mp4` with its capture report.
 * `--from 120 --to 150 --every 20` (or `--step <seconds>`) writes every 20th
 * frame of that range as stills, and `--at 12,30.5` writes those seconds, to
 * `media/automovie/<film>/frames/` or `--out <dir>`, named
 * `f<frame>-t<seconds>.png`. `--film` may be omitted while only one film exists.
 * A bare `http://...` argument selects the running Viewer, as `VIEWER_URL`
 * does; the default is this production's Viewer at 127.0.0.1:5199. The video
 * mode encodes the picture only, then decodes the delivered file completely,
 * writing `decode-report.json` beside it; video diffusion makes the audio.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment gives both modes, every option and its unit, the default folders and the still names.
 * @evidence contracts/development/implementation.md#principled-implementation One parser, film selection and capture URL serve both modes, so a still and the video's frame at the same second come from the same Viewer, raster and frame grid; the installed planViewerFrameTimes plans the seconds on the film's frame rate, and the installed renderViewerVideo and renderViewerFrames capture through the Viewer's own seek hook.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The command parses arguments and composes the film registry with the installed planner and capture; capture, encoding and planning are not reimplemented here.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unknown option, a missing value, a missing CHROME_PATH or an ambiguous film throws instead of falling back to a guess.
 * @evidence contracts/development/implementation.md#efficient-algorithms Parsing is linear in the argument count; capture and encoding cost belong to the installed runners, and stills capture only the planned frames.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One Viewer load serves every frame of a run.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The installed runners release the browser and encoder on every outcome; the command keeps only the result it prints or writes.
 */
export async function render(): Promise<void> {
  const options: Map<string, string> = new Map();
  const argv: string[] = process.argv.slice(2);
  let viewer: string | undefined;
  for (let index: number = 0; index < argv.length; index++) {
    if (/^https?:\/\//.test(argv[index]!)) {
      viewer = argv[index]!;
      continue;
    }
    const [key, inline] = argv[index]!.split(/=(.*)/s) as [string, string?];
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
  const number: (key: string) => number | undefined = (
    key: string,
  ): number | undefined =>
    options.has(key) ? Number(options.get(key)) : undefined;

  const selected: { name: string; film: IFilm } = selectFilm(
    films,
    options.get("--film") ?? null,
  );
  const chromeExecutable: string = process.env.CHROME_PATH ?? "";
  if (chromeExecutable.length === 0)
    throw new Error(
      "Set CHROME_PATH to an installed Chrome or Chromium executable",
    );
  const url: URL = new URL(
    viewer ?? process.env.VIEWER_URL ?? "http://127.0.0.1:5199/",
  );
  url.searchParams.set("capture", "1");
  url.searchParams.set("w", "1280");
  url.searchParams.set("h", "720");
  url.searchParams.set("film", selected.name);

  // Any frame option asks for stills of those frames instead of the video.
  if (
    ["--at", "--from", "--to", "--every", "--step"].some(
      (key: string): boolean => options.has(key),
    )
  ) {
    const stills: { file: string }[] = await renderViewerFrames({
      url: url.href,
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
      outputDir:
        options.get("--out") ?? `media/automovie/${selected.name}/frames`,
      chromeExecutable,
    });
    for (const still of stills) console.log(still.file);
    return;
  }

  const directory: string =
    options.get("--out") ?? `media/automovie/${selected.name}/videos`;
  const result: IAutoMovieViewerVideoResult = await renderViewerVideo({
    url: url.href,
    spec: {
      target: "production",
      frameFormat: { width: 1280, height: 720, fps: selected.film.fps },
      toneMapping: "none",
      codec: "h264",
      pixelFormat: "yuv420p",
      crf: 18,
    },
    durationSeconds: selected.film.durationSeconds,
    frameDir: `.cache/render/${selected.name}`,
    // Frames whose page digest is unchanged are reused from the last run;
    // every fiftieth reused frame is recaptured to prove the digest whole.
    cacheDirectory: `.cache/frames/${selected.name}`,
    cacheVerifyEvery: 50,
    outputPath: path.join(directory, "film.mp4"),
    chromeExecutable,
    ffmpegExecutable: process.env.FFMPEG_PATH ?? ffmpeg ?? "",
    viewSelector: "#view",
    onProgress: (progress: {
      index: number;
      timeSeconds: number;
      bytes: number;
    }): void => {
      if (progress.index % 150 === 0) console.log(progress);
    },
  });
  if (result.frameCache) console.log({ frameCache: result.frameCache });
  await mkdir(directory, { recursive: true });
  await writeFile(
    path.join(directory, "capture-report.json"),
    JSON.stringify(result, null, 2),
  );
  const decoded = await decodeAutoMovieDelivery({
    outputPath: path.join(directory, "film.mp4"),
    ffmpegExecutable: process.env.FFMPEG_PATH ?? ffmpeg ?? "",
    ffprobeExecutable: process.env.FFPROBE_PATH ?? ffprobe.path,
    frameCount: Math.round(selected.film.durationSeconds * selected.film.fps),
    fps: selected.film.fps,
    width: 1280,
    height: 720,
  });
  await writeFile(
    path.join(directory, "decode-report.json"),
    JSON.stringify(decoded, null, 2),
  );
}

void render().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
