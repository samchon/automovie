import { planViewerFrameTimes } from "@automovie/render";
import {
  recordViewerPlayback,
  renderViewerFrames,
  writeViewerFrameSheet,
} from "@automovie/render/node";
import { DEFAULT_CHROME_EXECUTABLE } from "@automovie/render/node/chrome";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { IFilm } from "../IFilm";
import { films } from "../composition/films";
import { selectFilm } from "../selectFilm";
import { planReviewStills } from "./planReviewStills";

/** Stills per contact sheet, ten columns by five rows: one 10-second segment at the default rate. */
const SHEET_STILLS: number = 50;

const USAGE: string = [
  "Usage: review still <viewer-url> <duration-seconds> [output-directory]",
  "       review playback <viewer-url> <observation-seconds> [output-directory]",
  "       review sheet <viewer-url> [output-directory] [--rate <stills-per-second>]",
  "                    [--events <s,...>] [--view <label>=<view>]...",
].join("\n");

/** Shared installed review tools; captures the running production through its real host. */
async function main(): Promise<void> {
  const { positional, rate, events, views } = parseArguments(
    process.argv.slice(2),
  );
  const [kind, url]: (string | undefined)[] = positional;
  if (!kind || !url || !["still", "sheet", "playback"].includes(kind))
    throw new Error(USAGE);
  const query: URLSearchParams = new URL(url).searchParams;
  const selected: { name: string; film: IFilm } = selectFilm(
    films,
    query.get("film"),
  );
  const output: string | undefined =
    kind === "sheet" ? positional[2] : positional[3];
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
  const { fps, durationSeconds } = selected.film;

  if (kind === "sheet") {
    const start: number = Number(query.get("start") ?? 0);
    const end: number = Number(query.get("end") ?? durationSeconds);
    const times: number[] = planReviewStills({
      fps,
      durationSeconds,
      start,
      end,
      rate,
      events,
    });
    const captures: [string, string | null][] = views.length
      ? views
      : [["film", null]];
    for (const [label, view] of captures) {
      const capture: URL = new URL(url);
      if (view !== null) capture.searchParams.set("view", view);
      const folder: string = path.join(directory, label);
      const frames: Awaited<ReturnType<typeof renderViewerFrames>> =
        await renderViewerFrames({
          url: capture.href,
          chromeExecutable,
          width: 1280,
          height: 720,
          fps,
          times,
          outputDir: folder,
        });
      for (let first: number = 0; first < frames.length; first += SHEET_STILLS)
        console.log(
          await writeViewerFrameSheet({
            frames: frames.slice(first, first + SHEET_STILLS),
            output: path.join(
              folder,
              `sheet-${start}-${end}-${first / SHEET_STILLS + 1}.png`,
            ),
            columns: 10,
            width: 320,
            height: 180,
            maximumPixels: 32_000_000,
          }),
        );
    }
    return;
  }

  const seconds: number = Number(positional[2]);
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
      fps,
      times: planViewerFrameTimes({
        durationSeconds: seconds,
        fps,
        at: [Number(query.get("at") ?? 0)],
      }),
      outputDir: directory,
    }),
  );
}

/**
 * Split positional arguments from the sheet options: `--rate` stills per
 * second, `--events` comma-separated film seconds and repeated
 * `--view <label>=<view>`, whose value the page reads from its `view` URL
 * parameter and whose label names the output folder.
 */
function parseArguments(argv: readonly string[]): {
  positional: string[];
  rate: number | undefined;
  events: number[];
  views: [string, string][];
} {
  const positional: string[] = [];
  let rate: number | undefined;
  const events: number[] = [];
  const views: [string, string][] = [];
  for (let i: number = 0; i < argv.length; i++) {
    const option: string = argv[i]!;
    if (!option.startsWith("--")) {
      positional.push(option);
      continue;
    }
    const value: string | undefined = argv[++i];
    if (value === undefined) throw new Error(`${option} needs a value\n${USAGE}`);
    if (option === "--rate") rate = Number(value);
    else if (option === "--events")
      events.push(...value.split(",").map(Number));
    else if (option === "--view") {
      const split: number = value.indexOf("=");
      const label: string = value.slice(0, split);
      if (split < 1 || !/^[a-z0-9-]+$/.test(label))
        throw new Error(`--view needs <label>=<view> with a lowercase label\n${USAGE}`);
      views.push([label, value.slice(split + 1)]);
    } else throw new Error(`Unknown option ${option}\n${USAGE}`);
  }
  return { positional, rate, events, views };
}

void main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
