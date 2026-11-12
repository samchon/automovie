import type * as Render from "@automovie/render";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { AutoMovieCaptureHost } from "./AutoMovieCaptureHost";
import { loadAutoMovieProductionModule } from "./loadAutoMovieProductionModule";
import { readAutoMovieCaptureHostOptions } from "./readAutoMovieCaptureHostOptions";
import { readAutoMovieRevision } from "./readAutoMovieRevision";
import { readAutoMovieVideoProbe } from "./readAutoMovieVideoProbe";
import { resolveAutoMovieFfmpeg } from "./resolveAutoMovieFfmpeg";
import { runAutoMovieFfmpeg } from "./runAutoMovieFfmpeg";

/**
 * Run `automovie capture` in a production: read the options through the request grammar, capture a subject drawn by the draw page or a video file's own frames, print what was written, and resolve to the exit status.
 *
 * Options are read by `readAutoMovieCaptureArguments` and split by `readAutoMovieCaptureHostOptions`; the rest is the request `parseAutoMovieCapturePlanRequest` reads, so the command takes exactly the keys of a page's address. With `--module` the subject is drawn through `AutoMovieCaptureHost`, its module called with the JSON of `--props` when given; with `--file` the file is probed by FFmpeg and captured by `runAutoMovieVideoCapture`, its subject named by `subject` or the file's name. Both write into `--out`, or `media/capture/<subject>`.
 *
 * It prints the folder and how many cells were drawn, the backend, every sheet, every cell not drawn with its cause, and each unmatched or changed comparison entry. The status is 1 when any cell was not drawn, because an undrawn cell is unverified evidence, and 0 otherwise; a refusal throws to `run`, which prints it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how options are read and split, both sources, where they write, what is printed, and the exit status with its reason.
 * @evidence contracts/development/implementation.md#principled-implementation Every rule of a capture is the render package's; the command loads that package from the production, supplies the browser or FFmpeg, and reports.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read, then one branch per source, then one report.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unknown option is refused by the request reader instead of ignored, and FFmpeg is resolved only for a video so a drawn capture never needs it.
 * @evidence contracts/development/implementation.md#efficient-algorithms One host or two FFmpeg runs plus the probe; printing is linear in the record.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One capture per command.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The host is closed on every outcome.
 */
export async function captureAutoMovie(props: {
  /** The tokens after `capture`. */
  args: readonly string[];

  /** The production's root folder, the working directory. */
  root: string;

  /** The environment, read for `CHROME_PATH` and `FFMPEG_PATH`. */
  env: Readonly<Record<string, string | undefined>>;
}): Promise<number> {
  const { root } = props;
  const render: typeof Render = loadAutoMovieProductionModule(
    root,
    "@automovie/render",
  ) as typeof Render;
  const options: ReturnType<typeof readAutoMovieCaptureHostOptions> =
    readAutoMovieCaptureHostOptions(
      render.readAutoMovieCaptureArguments(props.args),
    );
  const request: Render.IAutoMovieCapturePlanRequest =
    render.parseAutoMovieCapturePlanRequest(options.request);

  let record: Extract<Render.IAutoMovieCaptureRecord, { state: "complete" }>;
  let backend: string;
  let folder: string;
  if (options.file !== null) {
    // A video file: probe it, then capture its own frames.
    const ffmpeg: string = resolveAutoMovieFfmpeg({
      env: props.env,
      load: (id: string): unknown => loadAutoMovieProductionModule(root, id),
    });
    const file: string = path.resolve(root, options.file);
    const probe: ReturnType<typeof readAutoMovieVideoProbe> =
      readAutoMovieVideoProbe(
        await runAutoMovieFfmpeg(
          ffmpeg,
          ["-hide_banner", "-i", file],
          (): boolean => true,
        ),
      );
    const name: string = request.subject ?? path.parse(file).name;
    folder = path.resolve(
      root,
      options.out ?? path.join("media", "capture", name),
    );
    record = await render.runAutoMovieVideoCapture({
      file,
      subject: { name, ...probe },
      request,
      storage: fs,
      root: folder,
      run: async (args: readonly string[]): Promise<void> => {
        await runAutoMovieFfmpeg(ffmpeg, args);
      },
      revision: readAutoMovieRevision(root),
    });
    backend = `ffmpeg ${ffmpeg}`;
  } else {
    // A drawn subject, through the draw page in headless Chromium.
    const host: AutoMovieCaptureHost = await AutoMovieCaptureHost.open({
      root,
      module: options.module!,
      backend: options.backend,
      env: props.env,
    });
    try {
      record = await host.capture({
        request,
        props:
          options.props === null
            ? null
            : JSON.parse(
                await fs.readFile(path.resolve(root, options.props), "utf8"),
              ),
        ...(options.out === null ? {} : { out: options.out }),
      });
    } finally {
      await host.close();
    }
    backend = host.backend;
    folder = path.resolve(
      root,
      options.out ?? path.join("media", "capture", record.subject.name),
    );
  }

  // What was written, and what was not drawn.
  const failed: Extract<
    Render.IAutoMovieCaptureRecord.Row,
    { state: "failed" }
  >[] = record.rows.filter(
    (
      row: Render.IAutoMovieCaptureRecord.Row,
    ): row is Extract<
      Render.IAutoMovieCaptureRecord.Row,
      { state: "failed" }
    > => row.state === "failed",
  );
  const lines: string[] = [
    `capture ${record.subject.name}: ${record.rows.length - failed.length} of ${record.rows.length} cells drawn into ${folder}`,
    `backend ${backend}`,
    ...record.sheets.map((sheet: string): string => path.join(folder, sheet)),
    ...failed.map(
      (
        row: Extract<Render.IAutoMovieCaptureRecord.Row, { state: "failed" }>,
      ): string => `not drawn ${row.name}: ${row.cause}`,
    ),
    ...(record.comparison === null
      ? []
      : record.comparison.entries.flatMap(
          (entry: Render.IAutoMovieCaptureComparison.Entry): string[] =>
            entry.state === "unmatched"
              ? [`unmatched ${entry.current ?? entry.earlier}: ${entry.cause}`]
              : entry.mode === "difference" && entry.changed !== 0
                ? [`changed ${entry.current}: ${entry.changed} pixels`]
                : [],
        )),
  ];
  process.stdout.write(`${lines.join("\n")}\n`);
  return failed.length === 0 ? 0 : 1;
}
