import type {
  IAutoMovieCaptureCellComparison,
  IAutoMovieCaptureCellRecord,
  IAutoMovieCaptureFindingDiff,
  IAutoMovieCapturePlanRequest,
  IAutoMovieCaptureRecord,
  IAutoMovieCaptureStorage,
} from "@automovie/interface";
import type * as Render from "@automovie/render";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import type { AutoMovieFfmpegStaticPath } from "../../ffmpeg/internal/AutoMovieFfmpegStaticPath";
import { loadAutoMovieProductionModule } from "../../production/internal/loadAutoMovieProductionModule";
import { readAutoMovieRevision } from "../../production/internal/readAutoMovieRevision";
import { resolveAutoMovieFfmpeg } from "../../ffmpeg/internal/resolveAutoMovieFfmpeg";
import { runAutoMovieFfmpeg } from "../../ffmpeg/internal/runAutoMovieFfmpeg";
import { AutoMovieCliCaptureHost } from "../AutoMovieCliCaptureHost";
import type { AutoMovieCliCaptureTypes } from "../AutoMovieCliCaptureTypes";
import { readAutoMovieCaptureHostOptions } from "./readAutoMovieCaptureHostOptions";
import { readAutoMovieVideoProbe } from "./readAutoMovieVideoProbe";

/**
 * Run `automovie capture` in a production: read the options through the request
 * grammar, capture a subject drawn by the draw page or a video file's own
 * frames, print what was written, and resolve to the exit status.
 *
 * Options are read by `readAutoMovieCaptureArguments` and split by
 * `readAutoMovieCaptureHostOptions`; the rest is the request
 * `parseAutoMovieCapturePlanRequest` reads, so the command takes exactly the
 * keys of a page's address. With `--module` the subject is drawn through
 * `AutoMovieCliCaptureHost`, its module called with the JSON of `--props` when
 * given; with `--file` the file is probed by FFmpeg and captured by
 * `runAutoMovieVideoCapture`, its subject named by `subject` or the file's
 * name. Both write into `--out`, or `media/capture/<subject>`.
 *
 * It prints the folder and how many cells were drawn, the backend, every sheet,
 * every cell not drawn with its cause, each unmatched or changed comparison
 * entry, and the comparison's finding outcome with each fixed, new, worse or
 * unmatched finding. The finding outcome does not change the status: the status
 * is 1 when any cell was not drawn, because an undrawn cell is unverified
 * evidence, and 0 otherwise; a refusal throws to `run`, which prints it.
 */
export async function captureAutoMovie(
  props: AutoMovieCliCaptureTypes.Props,
): Promise<number> {
  const { root } = props;
  const render: typeof Render = loadAutoMovieProductionModule<typeof Render>(
    root,
    "@automovie/render",
  );
  const options: ReturnType<typeof readAutoMovieCaptureHostOptions> =
    readAutoMovieCaptureHostOptions(
      render.AutoMovieRenderCapture.readArguments(props.args),
    );
  const request: IAutoMovieCapturePlanRequest =
    render.AutoMovieRenderCapture.parsePlanRequest(options.request);

  const recordPath = (folder: string): string =>
    path.join(
      folder,
      ...(request.round === null ? [] : ["rounds", request.round]),
      "record.json",
    );
  const admitFolder = (folder: string): void => {
    if (props.expectedRecord === undefined) return;
    const file: string = recordPath(folder);
    if (path.relative(props.expectedRecord, file) !== "")
      throw new Error(
        `The configured capture would write ${file}. The check declares ${props.expectedRecord}.`,
      );
  };
  if (options.out !== null && props.expectedRecord !== undefined)
    admitFolder(path.resolve(root, options.out));

  let recordText: string | undefined;
  const storage: IAutoMovieCaptureStorage =
    props.recorded === undefined
      ? fs
      : {
          ...fs,
          writeFile: async (
            file: string,
            data: Parameters<IAutoMovieCaptureStorage["writeFile"]>[1],
          ): Promise<void> => {
            await fs.writeFile(file, data);
            if (
              typeof data === "string" &&
              path.basename(file) === "record.json"
            )
              recordText = data;
          },
        };

  let record: Extract<IAutoMovieCaptureRecord, { state: "complete" }>;
  let backend: string;
  let folder: string;
  if (options.file !== null) {
    // A video file: probe it, then capture its own frames.
    const file: string = path.resolve(root, options.file);
    const name: string = request.subject ?? path.parse(file).name;
    folder = path.resolve(
      root,
      options.out ?? path.join("media", "capture", name),
    );
    if (options.out === null) admitFolder(folder);
    const ffmpeg: string = resolveAutoMovieFfmpeg({
      env: props.env,
      load: (id: "ffmpeg-static"): AutoMovieFfmpegStaticPath =>
        loadAutoMovieProductionModule<AutoMovieFfmpegStaticPath>(root, id),
    });
    const probe: ReturnType<typeof readAutoMovieVideoProbe> =
      readAutoMovieVideoProbe(
        await runAutoMovieFfmpeg(ffmpeg, [
          "-hide_banner",
          "-threads",
          "1",
          "-i",
          file,
          "-map",
          "0:v:0",
          "-vf",
          "showinfo=checksum=0",
          "-frames:v",
          "1",
          "-f",
          "null",
          "-",
        ]),
      );
    record = await render.AutoMovieRenderCapture.runVideo({
      file,
      subject: { name, ...probe },
      request,
      storage,
      root: folder,
      run: async (args: readonly string[]): Promise<void> => {
        await runAutoMovieFfmpeg(ffmpeg, args);
      },
      revision: readAutoMovieRevision(root),
    });
    backend = `ffmpeg ${ffmpeg}`;
  } else {
    // A drawn subject, through the draw page in headless Chromium.
    const host: AutoMovieCliCaptureHost = await AutoMovieCliCaptureHost.open({
      root,
      module: options.module!,
      backend: options.backend,
      timeout: options.timeout,
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
        ...(options.out === null ? { admitFolder } : { out: options.out }),
        storage,
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
  const failed: Extract<IAutoMovieCaptureCellRecord, { state: "failed" }>[] =
    record.rows.filter(
      (
        row: IAutoMovieCaptureCellRecord,
      ): row is Extract<IAutoMovieCaptureCellRecord, { state: "failed" }> =>
        row.state === "failed",
    );
  const lines: string[] = [
    `capture ${record.subject.name}: ${record.rows.length - failed.length} of ${record.rows.length} cells drawn into ${folder}`,
    `backend ${backend}`,
    ...record.sheets.map((sheet: string): string => path.join(folder, sheet)),
    ...failed.map(
      (
        row: Extract<IAutoMovieCaptureCellRecord, { state: "failed" }>,
      ): string => `not drawn ${row.name}: ${row.cause}`,
    ),
    ...(record.comparison === null
      ? []
      : record.comparison.entries.flatMap(
          (entry: IAutoMovieCaptureCellComparison): string[] =>
            entry.state === "unmatched"
              ? [`unmatched ${entry.current ?? entry.earlier}: ${entry.cause}`]
              : entry.mode === "difference" && entry.changed !== 0
                ? [`changed ${entry.current}: ${entry.changed} pixels`]
                : [],
        )),
    ...(record.comparison === null
      ? []
      : describeFindings(record.comparison.findings)),
  ];
  if (props.recorded !== undefined) {
    if (recordText === undefined)
      throw new Error("The capture completed without writing its record.");
    props.recorded(recordPath(folder), recordText);
  }
  const output: string = `${lines.join("\n")}\n`;
  if (props.write === undefined) process.stdout.write(output);
  else props.write(output);
  return failed.length === 0 ? 0 : 1;
}

/**
 * The finding outcome, then each fixed, new, worse or unmatched finding, one
 * per line.
 */
function describeFindings(diff: IAutoMovieCaptureFindingDiff): string[] {
  if (diff.state === "omitted")
    return [
      `findings not compared: no diagnostics in ${diff.lacking
        .map((side: "earlier" | "current"): string =>
          side === "earlier" ? "the earlier round" : "this capture",
        )
        .join(" or ")}`,
    ];
  return [
    `findings ${diff.outcome}`,
    ...diff.entries.flatMap(
      (entry: IAutoMovieCaptureFindingDiff.IEntry): string[] => {
        const name: string = `${entry.category} ${entry.check} ${entry.code} ${entry.key} in ${entry.scope}`;
        return entry.state === "unmatched"
          ? [`unmatched ${name}: ${entry.cause}`]
          : entry.state === "carried"
            ? entry.change === "worse"
              ? [`worse ${name}`]
              : []
            : [`${entry.state} ${name}`];
      },
    ),
  ];
}
