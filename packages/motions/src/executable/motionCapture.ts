import {
  type IAutoMovieCapturePlanRequest,
  type IAutoMovieCaptureRecord,
  parseAutoMovieCapturePlanRequest,
  readAutoMovieCaptureArguments,
} from "@automovie/render";
import { AutoMovieCaptureHost } from "automovie";
import path from "node:path";

import type { IMotionCaptureCase } from "./IMotionCaptureCase";
import { markMotionCaptureCase } from "../capture/markMotionCaptureCase";
import type { IMotionCaptureProps } from "./IMotionCaptureProps";
import { MOTION_CAPTURE_CASES } from "./cases/MOTION_CAPTURE_CASES";
import { planMotionCaptureProps } from "./planMotionCaptureProps";

/** The motions package, whose `media/capture/<case>/` holds each case's capture. */
const ROOT: string = path.join(__dirname, "..", "..");

/** The subject module the draw page is built from. */
const MODULE: string = "src/executable/subjects.ts";

/**
 * The harness's default views by its own names, as view texts of the shared grammar: orthographic, fitted to everything a case draws over all its instants, so lengths read true to scale and every cell of a view shares one camera.
 */
const VIEWS: Readonly<Record<string, string>> = {
  front: "front@ortho",
  side: "right@ortho",
  top: "top@ortho",
  threeQuarter: "three-quarter@ortho",
};

/** Pixels on each side of every still: square, so the four views share one cell shape. */
const RASTER: { width: number; height: number } = { width: 720, height: 720 };

/**
 * Draw motion cases through the shared capture host and report their verdicts.
 *
 * `pnpm --dir packages/motions node:capture -- --case <name>[,<name>…]` builds each named case of `MOTION_CAPTURE_CASES` (`--list` prints them) and captures it with `automovie capture`'s host: the page built from `subjects` draws the case's instants (`at`) through its views into `packages/motions/media/capture/<case>/`, as stills, contact sheets and `record.json`. The record's section holds the case's instants with their labels, its performers, its verdicts and its metrics. The process exits non-zero when any verdict fails or any cell is not drawn.
 *
 * Options of the harness: `--only <regex>` keeps the cases whose name matches, a factory that reads the filter building no other; `--views a,b` picks among `front`, `side`, `top` and `threeQuarter`, or gives view texts of the shared grammar; `--verdicts` prints the verdicts without drawing; `--backend gpu` draws on the GPU instead of SwiftShader. Every other option is a key of the capture request grammar, such as `--marks`, `--label`, `--passes`, `--round` or `--compare`; `subject` and `at` are the case's. Without `--marks`, every mark of the case is drawn.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives every option, the default views, the output, what the record's section holds, and the exit status.
 * @evidence contracts/development/implementation.md#principled-implementation A case is a subject like any other: the harness supplies its data and its verdicts, and the shared host plans, draws, lays out, records and compares, so a motion case takes the request every subject takes.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read options, build cases, open one host, capture each case, report.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unknown cases throw; request options are refused by the shared reader; a failed verdict, an undrawn cell or a case the host could not capture fails the run, the last without stopping the other cases.
 * @evidence contracts/development/implementation.md#efficient-algorithms One page build and one browser for every case of a run; each case draws its instants times views times passes.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The host's built page and browser serve every case.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The host is closed on every outcome; each case's page is closed by the host.
 */
export async function motionCapture(): Promise<void> {
  const options: Map<string, string> = readAutoMovieCaptureArguments(
    process.argv.slice(2).filter((argument: string): boolean => argument !== "--"),
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
    if (options.has(key)) throw new Error(`--${key} is the case's own; omit it`);
  const only: RegExp | null = ((text: string | null): RegExp | null =>
    text === null ? null : new RegExp(text))(take("only"));
  const verdicts: boolean = take("verdicts") !== null;
  const backend: string = take("backend") ?? "software";
  if (backend !== "software" && backend !== "gpu")
    throw new Error(`--backend "${backend}" is not software or gpu`);
  const views: string = (take("views") ?? Object.keys(VIEWS).join(","))
    .split(",")
    .map((view: string): string => VIEWS[view.trim()] ?? view.trim())
    .join(";");

  // Build every case first, so a bad name or filter costs no browser.
  const cases: IMotionCaptureCase[] = [];
  for (const name of names) {
    const factory:
      | ((only?: (name: string) => boolean) => Iterable<IMotionCaptureCase>)
      | undefined = MOTION_CAPTURE_CASES[name];
    if (factory === undefined) throw new Error(`Unknown case ${name}`);
    const filter: ((name: string) => boolean) | undefined =
      only === null ? undefined : (candidate: string): boolean => only.test(candidate);
    for (const capture of factory(filter))
      if (filter === undefined || filter(capture.name)) cases.push(capture);
  }
  if (cases.length === 0) throw new Error("No case matches --case and --only");

  let failed: number = 0;
  if (verdicts) {
    for (const capture of cases) failed += report(capture);
    if (failed !== 0) process.exitCode = 1;
    return;
  }
  const host: AutoMovieCaptureHost = await AutoMovieCaptureHost.open({
    root: ROOT,
    module: MODULE,
    backend,
    env: process.env,
  });
  try {
    for (const capture of cases) {
      const props: IMotionCaptureProps = planMotionCaptureProps(capture, RASTER);
      const marked: boolean = markMotionCaptureCase(props).length !== 0;

      // A still is named to the millisecond, so instants a case lists twice within one millisecond are drawn once.
      const drawn: number[] = [
        ...new Map(
          props.seconds.map((seconds: number): [string, number] => [seconds.toFixed(3), seconds]),
        ).values(),
      ];
      const request: IAutoMovieCapturePlanRequest = parseAutoMovieCapturePlanRequest(
        new Map<string, string>([
          ...options,
          ["subject", capture.name],
          ["at", drawn.join(",")],
          ["views", views],
          ...(options.has("marks") || !marked ? [] : [["marks", "case"] as [string, string]]),
        ]),
      );

      // A case the host refuses, such as a page that cannot describe it, fails alone and the next case still draws.
      let record: Extract<IAutoMovieCaptureRecord, { state: "complete" }>;
      try {
        record = await host.capture({
          request,
          props,
          out: path.join(ROOT, "media", "capture", capture.name),
          section: {
            case: capture.name,
            times: capture.times,
            performers: capture.performers.map(
              (p: IMotionCaptureCase.IPerformer): string => `${p.id}:${p.body.skeleton.id}`,
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
      const undrawn: IAutoMovieCaptureRecord.Row[] = record.rows.filter(
        (row: IAutoMovieCaptureRecord.Row): boolean => row.state === "failed",
      );
      console.log(
        `${capture.name}: ${record.rows.length - undrawn.length} of ${record.rows.length} cells drawn in ${path.join(ROOT, "media", "capture", capture.name)}`,
      );
      for (const row of undrawn)
        if (row.state === "failed") console.log(`  not drawn ${row.name}: ${row.cause}`);
      failed += report(capture) + undrawn.length;
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
  return verdicts.filter((v: IMotionCaptureCase.IVerdict): boolean => !v.passed).length;
}

void motionCapture().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
