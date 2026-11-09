import { planViewerFrameTimes } from "@automovie/render";
import {
  recordViewerPlayback,
  renderViewerFrames,
} from "@automovie/render/node";
import { DEFAULT_CHROME_EXECUTABLE } from "@automovie/render/node/chrome";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { IFilm } from "../IFilm";
import { films } from "../composition/films";
import { selectFilm } from "../selectFilm";

const USAGE: string = [
  "Usage: review still <viewer-url> <duration-seconds> [output-directory]",
  "       review playback <viewer-url> <observation-seconds> [output-directory]",
].join("\n");

/**
 * Shared installed review tools; captures the running production through its
 * real host. Stills and contact sheets of intervals belong to `npm run
 * capture`.
 */
async function main(): Promise<void> {
  const [kind, url, duration, output] = process.argv.slice(2);
  if (!kind || !url || !["still", "playback"].includes(kind))
    throw new Error(USAGE);
  const query: URLSearchParams = new URL(url).searchParams;
  const selected: { name: string; film: IFilm } = selectFilm(
    films,
    query.get("film"),
  );
  const directory: string =
    output ??
    path.join(
      "media",
      "automovie",
      selected.name,
      kind === "playback" ? "videos" : "frames",
      "review",
    );
  await mkdir(directory, { recursive: true });
  const chromeExecutable: string =
    process.env.CHROME_PATH ?? DEFAULT_CHROME_EXECUTABLE;
  const seconds: number = Number(duration);
  if (!(seconds > 0) || !Number.isFinite(seconds)) throw new Error(USAGE);
  if (kind === "playback") {
    const recorded: Awaited<ReturnType<typeof recordViewerPlayback>> =
      await recordViewerPlayback({
        url,
        chromeExecutable,
        outputDir: directory,
        seconds,
        viewport: { width: 1280, height: 900 },
      });
    await writeFile(
      path.join(directory, "playback.json"),
      JSON.stringify(recorded, null, 2),
      "utf8",
    );
    console.log(recorded);
    return;
  }
  console.log(
    await renderViewerFrames({
      url,
      chromeExecutable,
      width: 1280,
      height: 720,
      fps: selected.film.fps,
      times: planViewerFrameTimes({
        durationSeconds: seconds,
        fps: selected.film.fps,
        at: [Number(query.get("at") ?? 0)],
      }),
      outputDir: directory,
    }),
  );
}

void main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
