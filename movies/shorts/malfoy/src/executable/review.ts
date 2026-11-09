import { planViewerFrameTimes } from "@automovie/render";
import { recordViewerPlayback } from "../integrations/render/node/recordViewerPlayback";
import { renderViewerFrames } from "../integrations/render/node/renderViewerFrames";
import { writeViewerFrameSheet } from "../integrations/render/node/writeViewerFrameSheet";
import { DEFAULT_CHROME_EXECUTABLE } from "../integrations/render/node/capture/DEFAULT_CHROME_EXECUTABLE";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { films } from "../composition/films";
import { selectFilm } from "../selectFilm";

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
              at: [Number(new URL(url).searchParams.get("at") ?? 0)],
            })
          : planViewerFrameTimes({
              durationSeconds: seconds,
              fps: 30,
              from: 0,
              to: seconds,
              every: 20,
            }),
      outputDir: directory,
    });
  if (kind === "sheet")
    console.log(
      await writeViewerFrameSheet({
        frames,
        output: path.join(directory, "sheet.png"),
        columns: 5,
        width: 320,
        height: 180,
        maximumPixels: 32_000_000,
      }),
    );
  else console.log(frames);
}

void main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
