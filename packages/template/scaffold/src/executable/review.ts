import { planViewerFrameTimes } from "@automovie/render";
import {
  recordViewerPlayback,
  renderViewerFrames,
  writeViewerFrameSheet,
} from "@automovie/render/node";
import { DEFAULT_CHROME_EXECUTABLE } from "@automovie/render/node/chrome";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { films } from "../composition/films";
import { selectFilm } from "../selectFilm";

/** Evenly spaced stills one segment sheet pass captures, first and last second included. */
const SEGMENT_STILLS: number = 200;

/** Stills per contact sheet, ten columns by five rows. */
const SHEET_STILLS: number = 50;

/** Shared installed review tools; captures the running production through its real host. */
async function main(): Promise<void> {
  const [kind, url, duration, output]: string[] = process.argv.slice(2);
  if (
    !kind ||
    !url ||
    !duration ||
    !["still", "sheet", "playback"].includes(kind)
  )
    throw new Error(
      "Usage: review <still|sheet|playback> <viewer-url> <duration-seconds> [output-directory]",
    );
  const seconds: number = Number(duration);
  if (!(seconds > 0) || !Number.isFinite(seconds))
    throw new Error("Review duration must be positive seconds");
  const directory: string =
    output ??
    path.join(
      "media",
      "automovie",
      selectFilm(films, new URL(url).searchParams.get("film")).name,
      kind === "playback" ? "videos" : "frames",
      "review",
    );
  await mkdir(directory, { recursive: true });
  const chromeExecutable: string =
    process.env.CHROME_PATH ?? DEFAULT_CHROME_EXECUTABLE;
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
  const query: URLSearchParams = new URL(url).searchParams;
  const start: number = Number(query.get("start") ?? 0);
  const end: number = Number(query.get("end") ?? seconds);
  if (kind === "sheet" && !(0 <= start && start < end && end <= seconds))
    throw new Error(`The segment must satisfy 0 <= start < end <= ${seconds}`);
  const frames: Awaited<ReturnType<typeof renderViewerFrames>> =
    await renderViewerFrames({
      url,
      chromeExecutable,
      width: 1280,
      height: 720,
      fps: 30,
      times:
        kind === "still"
          ? planViewerFrameTimes({
              durationSeconds: seconds,
              fps: 30,
              at: [Number(query.get("at") ?? 0)],
            })
          : planViewerFrameTimes({
              durationSeconds: seconds,
              fps: 30,
              from: start,
              to: end,
              step: (end - start) / (SEGMENT_STILLS - 1),
            }),
      outputDir: directory,
    });
  if (kind === "still") {
    console.log(frames);
    return;
  }
  for (let first: number = 0; first < frames.length; first += SHEET_STILLS)
    console.log(
      await writeViewerFrameSheet({
        frames: frames.slice(first, first + SHEET_STILLS),
        output: path.join(
          directory,
          `sheet-${start}-${end}-${first / SHEET_STILLS + 1}.png`,
        ),
        columns: 10,
        width: 320,
        height: 180,
        maximumPixels: 32_000_000,
      }),
    );
}

void main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
