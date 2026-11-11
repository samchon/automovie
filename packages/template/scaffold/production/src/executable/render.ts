import ffmpeg from "ffmpeg-static";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { IFilm } from "../IFilm";
import { films } from "../composition/films";
import { selectFilm } from "../selectFilm";
import type { IAutoMovieViewerVideoResult } from "./render/node/IAutoMovieViewerVideoResult";
import { renderViewerVideo } from "./render/node/renderViewerVideo";

/**
 * Export one film as a picture-only video, every frame drawn by the running
 * server's draw-only page.
 *
 * `npm run render -- --film <name>` writes the whole film to
 * `media/automovie/<film>/videos/film.mp4`, or `--out <dir>`, with its
 * capture report. `--film` may be omitted while only one film exists. The page
 * is `render/index.html` of `VIEWER_URL` (`http://127.0.0.1:5173/` by
 * default), and Chromium is `CHROME_PATH` or the build Playwright pins. Stills
 * of a window come from `npm run capture`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment gives the command, its options, the default folder, the page and browser it uses, and where stills come from instead.
 * @evidence contracts/development/implementation.md#principled-implementation The film is selected from the registry and drawn by the draw-only page's draw function, the one every capture uses, through renderViewerVideo on the film's frame rate and raster.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The command parses arguments and composes the film registry with the installed planner and capture; capture, encoding and planning are not reimplemented here.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unknown option, a missing value or an ambiguous film throws instead of falling back to a guess.
 * @evidence contracts/development/implementation.md#efficient-algorithms Parsing is linear in the argument count; capture and encoding cost belong to the installed runners.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One page load serves every frame of a run.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The installed runners release the browser and encoder on every outcome; the command keeps only the result it prints or writes.
 */
export async function render(): Promise<void> {
  const options: Map<string, string> = new Map();
  const argv: string[] = process.argv.slice(2);
  for (let index: number = 0; index < argv.length; index++) {
    const [key, inline] = argv[index]!.split(/=(.*)/s) as [string, string?];
    if (!["--film", "--out"].includes(key))
      throw new Error(`Unknown option ${key}`);
    const value: string | undefined = inline ?? argv[++index];
    if (value === undefined || value === "")
      throw new Error(`${key} needs a value`);
    options.set(key, value);
  }
  const selected: { name: string; film: IFilm } = selectFilm(
    films,
    options.get("--film") ?? null,
  );
  const chrome: string | undefined = process.env.CHROME_PATH?.trim();
  const chromeExecutable: string | undefined =
    chrome === undefined || chrome === "" ? undefined : chrome;
  const url: URL = new URL(
    "render/index.html",
    process.env.VIEWER_URL ?? "http://127.0.0.1:5173/",
  );
  const width: number = selected.film.width ?? 1280;
  const height: number = selected.film.height ?? 720;

  const directory: string =
    options.get("--out") ?? `media/automovie/${selected.name}/videos`;
  const result: IAutoMovieViewerVideoResult = await renderViewerVideo({
    url: url.href,
    subject: selected.name,
    spec: {
      target: "production",
      frameFormat: { width, height, fps: selected.film.fps },
      toneMapping: "none",
      codec: "h264",
      pixelFormat: "yuv420p",
      crf: 18,
    },
    durationSeconds: selected.film.durationSeconds,
    frameDir: `.cache/render/${selected.name}`,
    outputPath: path.join(directory, "film.mp4"),
    ...(chromeExecutable === undefined ? {} : { chromeExecutable }),
    ffmpegExecutable: process.env.FFMPEG_PATH ?? ffmpeg ?? "",
    onProgress: (progress: {
      index: number;
      timeSeconds: number;
      bytes: number;
    }): void => {
      if (progress.index % 150 === 0) console.log(progress);
    },
  });
  await mkdir(directory, { recursive: true });
  await writeFile(
    path.join(directory, "capture-report.json"),
    JSON.stringify(result, null, 2),
  );
}

void render().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
