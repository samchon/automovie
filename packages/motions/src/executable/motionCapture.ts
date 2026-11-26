import type {
  IAutoMovieCaptureCellRecord,
  IAutoMovieCapturePlanRequest,
  IAutoMovieCaptureRecord,
} from "@automovie/interface";
import { AutoMovieRenderCapture } from "@automovie/render";
import {
  AutoMovieCliCaptureHost,
  loadAutoMovieProductionModule,
  renderAutoMovieVideo,
  resolveAutoMovieFfmpeg,
} from "automovie";
import path from "node:path";

import { markMotionCaptureCase } from "../capture/markMotionCaptureCase";
import type { IMotionCaptureCase } from "./IMotionCaptureCase";
import type { IMotionCaptureProps } from "./IMotionCaptureProps";
import { buildMotionCaptureCases } from "./buildMotionCaptureCases";
import { MOTION_CAPTURE_CASES } from "./cases/MOTION_CAPTURE_CASES";
import { planMotionCaptureProps } from "./planMotionCaptureProps";

/** The motions package, whose `media/capture/<case>/` holds each case's capture. */
const ROOT: string = path.join(__dirname, "..", "..");

/** The subject module the draw page is built from. */
const MODULE: string = "src/executable/subjects.ts";

/**
 * The harness's default views by its own names, as view texts of the shared
 * grammar: orthographic, fitted to everything a case draws over all its
 * instants, so lengths read true to scale and every cell of a view shares one
 * camera.
 */
const VIEWS: Readonly<Record<string, string>> = {
  front: "front@ortho",
  side: "right@ortho",
  top: "top@ortho",
  threeQuarter: "three-quarter@ortho",
};
/** The record of `IRASTER`'s site. */
type IRASTER = { width: number; height: number };

/**
 * Pixels on each side of every still: square, so the four views share one cell
 * shape.
 */
const RASTER: IRASTER = { width: 720, height: 720 };
/** The record of `IMotionCaptureRecord`'s site. */
type IMotionCaptureRecord = { state: "complete" };

/** The record of `IMotionCaptureRequestInstant`'s site. */
type IMotionCaptureRequestInstant = { seconds: number };

/**
 * Draw motion cases through the shared capture host and report their verdicts.
 *
 * `pnpm --dir packages/motions node:capture -- --case <name>[,<name>…]` builds
 * each named case of `MOTION_CAPTURE_CASES` (`--list` prints them) and captures
 * it with `automovie capture`'s host: the page built from `subjects` draws the
 * case's instants (`at`) through its views into
 * `packages/motions/media/capture/<case>/`, as stills, contact sheets and
 * `record.json`. The record's section holds the case's instants with their
 * labels, its performers, its verdicts and its metrics. The process exits
 * non-zero when any verdict fails or any cell is not drawn.
 *
 * Options of the harness: `--only <regex>` keeps the cases whose name matches,
 * a factory that reads the filter building no other; `--views a,b` picks among
 * `front`, `side`, `top` and `threeQuarter`, or gives view texts of the shared
 * grammar; `--verdicts` prints the verdicts without drawing; `--video` also
 * renders each case's whole clock through the same page into
 * `media/video/<case>/film.mp4` with FFmpeg from `FFMPEG_PATH` or
 * `ffmpeg-static`; `--backend gpu` draws on the GPU instead of SwiftShader.
 * Every other option is a key of the capture request grammar, such as
 * `--marks`, `--label`, `--passes`, `--round` or `--compare`; `subject` and
 * `at` are the case's. Without `--marks`, every mark of the case is drawn.
 */
export async function motionCapture(): Promise<void> {
  const options: Map<string, string> = AutoMovieRenderCapture.readArguments(
    process.argv
      .slice(2)
      .filter((argument: string): boolean => argument !== "--"),
  );
  const take: (key: string) => string | null = (key: string): string | null => {
    const value: string | undefined = options.get(key);
    options.delete(key);
    return value ?? null;
  };
  if (take("list") !== null) {
    for (const name of Object.keys(MOTION_CAPTURE_CASES)) console.log(name);
    return;
  }
  const names: string[] = (take("case") ?? "")
    .split(",")
    .filter((name: string): boolean => name !== "");
  if (names.length === 0)
    throw new Error("Name cases with --case a,b or list them with --list");
  for (const key of ["subject", "at"])
    if (options.has(key))
      throw new Error(`--${key} is the case's own; omit it`);
  const only: RegExp | null = ((text: string | null): RegExp | null =>
    text === null ? null : new RegExp(text))(take("only"));
  const verdicts: boolean = take("verdicts") !== null;
  const video: boolean = take("video") !== null;
  const backend: string = take("backend") ?? "software";
  if (backend !== "software" && backend !== "gpu")
    throw new Error(`--backend "${backend}" is not software or gpu`);
  const views: string = (take("views") ?? Object.keys(VIEWS).join(","))
    .split(",")
    .map((view: string): string => VIEWS[view.trim()] ?? view.trim())
    .join(";");

  // Names are checked now, so a bad name costs no browser; each case is built as the loop reaches it and dropped after.
  const cases: Iterable<IMotionCaptureCase> = buildMotionCaptureCases(
    names,
    only,
  );

  let failed: number = 0;
  if (verdicts) {
    for (const capture of cases) failed += report(capture);
    if (failed !== 0) process.exitCode = 1;
    return;
  }
  // FFmpeg is found before the page is built, so a missing encoder costs no drawing.
  const ffmpeg: string | null = video
    ? resolveAutoMovieFfmpeg({
        env: process.env,
        load: (id: "ffmpeg-static"): string | null =>
          loadAutoMovieProductionModule<string | null>(ROOT, id),
      })
    : null;
  const host: AutoMovieCliCaptureHost = await AutoMovieCliCaptureHost.open({
    root: ROOT,
    module: MODULE,
    backend,
    env: process.env,
  });

  // Process boundary: the capture host is closed whether the captures complete or fail.
  try {
    for (const capture of cases) {
      const props: IMotionCaptureProps = planMotionCaptureProps(
        capture,
        RASTER,
      );
      const marked: boolean = markMotionCaptureCase(props).length !== 0;

      const request: IAutoMovieCapturePlanRequest =
        AutoMovieRenderCapture.parsePlanRequest(
          new Map<string, string>([
            ...options,
            ["subject", capture.name],
            [
              "at",
              props.instants
                .map(
                  (instant: IMotionCaptureRequestInstant): number =>
                    instant.seconds,
                )
                .join(","),
            ],
            ["views", views],
            ...(options.has("marks") || !marked
              ? []
              : [["marks", "case"] as [string, string]]),
          ]),
        );

      // A case the host refuses, such as a page that cannot describe it, fails alone and the next case still draws.
      let record: Extract<IAutoMovieCaptureRecord, IMotionCaptureRecord>;
      try {
        record = await host.capture({
          request,
          props,
          out: path.join(ROOT, "media", "capture", capture.name),
          section: {
            case: capture.name,
            times: capture.times,
            performers: capture.performers.map(
              (p: IMotionCaptureCase.IPerformer): string =>
                `${p.id}:${p.body.skeleton.id}`,
            ),
            verdicts: capture.verdicts ?? [],
            metrics: capture.metrics ?? {},
          },
        });
      } catch (error) {
        console.log(
          `${capture.name}: not captured: ${error instanceof Error ? error.message : String(error)}`,
        );
        failed += report(capture) + 1;
        continue;
      }
      const undrawn: IAutoMovieCaptureCellRecord[] = record.rows.filter(
        (row: IAutoMovieCaptureCellRecord): boolean => row.state === "failed",
      );
      console.log(
        `${capture.name}: ${record.rows.length - undrawn.length} of ${record.rows.length} cells drawn in ${path.join(ROOT, "media", "capture", capture.name)}`,
      );
      for (const row of undrawn)
        if (row.state === "failed")
          console.log(`  not drawn ${row.name}: ${row.cause}`);
      failed += report(capture) + undrawn.length;

      // The case's whole clock as a video, drawn by the same page.
      if (ffmpeg !== null) {
        const written: Awaited<ReturnType<typeof renderAutoMovieVideo>> =
          await renderAutoMovieVideo({
            host,
            root: ROOT,
            subject: capture.name,
            props,
            out: path.join(ROOT, "media", "video", capture.name),
            ffmpeg,
          });
        console.log(`  video ${written.video}: ${written.frames} frames`);
      }
    }
  } finally {
    await host.close();
  }
  if (failed !== 0) process.exitCode = 1;
}

/** Print one case's verdicts; returns the number that failed. */
function report(capture: IMotionCaptureCase): number {
  const verdicts: IMotionCaptureCase.IVerdict[] = capture.verdicts ?? [];
  console.log(`${capture.name}: ${capture.times.length} instants`);
  for (const v of verdicts)
    console.log(`  ${v.passed ? "pass" : "FAIL"} ${v.name}: ${v.detail}`);
  return verdicts.filter((v: IMotionCaptureCase.IVerdict): boolean => !v.passed)
    .length;
}

void motionCapture().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
