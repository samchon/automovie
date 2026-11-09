import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { IFilm } from "../IFilm";
import { films } from "../composition/films";
import { selectFilm } from "../selectFilm";
import { DEFAULT_CHROME_EXECUTABLE } from "./render/node/capture/DEFAULT_CHROME_EXECUTABLE";
import { recordViewerPlayback } from "./render/node/recordViewerPlayback";

const USAGE: string =
  "Usage: review playback <viewer-url> <observation-seconds> [output-directory]";

/**
 * Records actual Play-button playback of the running production through its
 * real host. Stills and contact sheets belong to `npm run capture`.
 */
async function main(): Promise<void> {
  const [kind, url, duration, output] = process.argv.slice(2);
  const seconds: number = Number(duration);
  if (
    kind !== "playback" ||
    !url ||
    !(seconds > 0) ||
    !Number.isFinite(seconds)
  )
    throw new Error(USAGE);
  const selected: { name: string; film: IFilm } = selectFilm(
    films,
    new URL(url).searchParams.get("film"),
  );
  const directory: string =
    output ??
    path.join("media", "automovie", selected.name, "videos", "review");
  await mkdir(directory, { recursive: true });
  const recorded: Awaited<ReturnType<typeof recordViewerPlayback>> =
    await recordViewerPlayback({
      url,
      chromeExecutable: process.env.CHROME_PATH ?? DEFAULT_CHROME_EXECUTABLE,
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
}

void main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
