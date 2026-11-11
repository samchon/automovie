import { AutoMovieRasterSheet } from "../picture/AutoMovieRasterSheet.js";
import type { IAutoMovieRasterImage } from "../picture/IAutoMovieRasterImage.js";
import { stampAutoMovieRasterLabel } from "../picture/stampAutoMovieRasterLabel.js";
import type { AutoMovieCaptureFolder } from "./AutoMovieCaptureFolder.js";
import { compareAutoMovieCaptureRounds } from "./compareAutoMovieCaptureRounds.js";
import { encodeAutoMovieRasterPng } from "../picture/encodeAutoMovieRasterPng.js";
import { formatAutoMovieCapturePlanRequest } from "./formatAutoMovieCapturePlanRequest.js";
import { hashAutoMovieRasterImage } from "../picture/hashAutoMovieRasterImage.js";
import type { IAutoMovieCaptureCell } from "./IAutoMovieCaptureCell.js";
import type { IAutoMovieCaptureComparison } from "./IAutoMovieCaptureComparison.js";
import type { IAutoMovieCaptureDrawing } from "./IAutoMovieCaptureDrawing.js";
import type { IAutoMovieCapturePlan } from "./IAutoMovieCapturePlan.js";
import type { IAutoMovieCaptureRecord } from "./IAutoMovieCaptureRecord.js";
import { markAutoMovieCaptureCell } from "./markAutoMovieCaptureCell.js";
import { scaleAutoMovieCaptureLabels } from "./scaleAutoMovieCaptureLabels.js";


/**
 * Draw a planned capture through the host's draw function and write its stills, contact sheets and record into its opened folder, so every rule of a capture runs the same in a Node host, a page and a test.
 *
 * Each cell is drawn in plan order, one at a time. A drawn still gets its labels stamped at their anchors, at a scale that keeps a label's font pixel at least one sheet pixel after the still is reduced into its cell, and is written as `<cell name>.png` with its content hash. A cell whose draw throws, or returns a picture that is not the subject's raster, is recorded with the cause and stands on the sheet as a marked cell, and the run continues. Sheets are written as `sheet-001.png` onwards as each fills. With a `compare` round, `compareAutoMovieCaptureRounds` follows at `match`. The record comes last.
 *
 * Files are touched in the order `AutoMovieCaptureFolder` states: the host opens the folder for the plan's round and compared round, which checks both before anything is deleted; every still and sheet is claimed in a `running` record before the first is written, the comparison's files are claimed before it writes, and the `complete` record is written last. It rejects a folder opened for another round, and a storage failure, leaving a record that owns every file written so far.
 *
 * ```ts
 * const plan = planAutoMovieCapture({ request, subject, cuts: [] });
 * const folder = await AutoMovieCaptureFolder.open({ storage: fs, root: "media/capture", round: request.round, compare: request.compare });
 * const record = await runAutoMovieCapture({ plan, draw, folder, revision, match: "cell" });
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is drawn and in what order, how labels are scaled and why, what happens to a failed cell, the file names, the order of file steps, and what a failure leaves.
 * @evidence contracts/development/implementation.md#principled-implementation `.agents/skills/visual-debugging/capture.md`: a cell that could not be drawn stays on the sheet with its cause, and the record keeps what repeats each observation. Pixels and files come only through the injected draw function and the folder's injected storage, so the order of file steps runs under a unit test.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Claim, then one loop that draws, stamps, writes and lays each cell, then the last sheet, the comparison and the record; folder rules are the folder's and comparison rules the comparison's.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A failed draw is recorded, never retried or replaced by a blank still, and a picture at the wrong raster is a failure rather than resized.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the cells and their pixels: one encoding, one hash and one reduction per still, one encoding per sheet.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each cell is drawn once; nothing is shared between runs.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One drawn still and the sheet being filled are held at a time, plus one record row per cell.
 */
export async function runAutoMovieCapture(props: {
  /** The capture, planned by `planAutoMovieCapture`. */
  plan: IAutoMovieCapturePlan;

  /** The host's draw function, called once per cell in plan order. */
  draw: (cell: IAutoMovieCaptureCell) => Promise<IAutoMovieCaptureDrawing>;

  /** The capture's folder, opened for the plan's round and compared round. */
  folder: AutoMovieCaptureFolder;

  /** Source revision the host draws from, such as a commit hash. */
  revision: string;

  /** How a comparison pairs cells: `cell` for two captures of a drawn subject, `time` for an encoded file against its source. */
  match: "cell" | "time";

  /** The video file the stills come from, with its detected cuts, recorded as it is; absent for a drawn subject. */
  video?: IAutoMovieCaptureRecord.IVideo;

  /** The subject owner's own section of the record, such as a motion case's verdicts and metrics, written as it is; absent when the owner has none. */
  section?: Readonly<Record<string, unknown>>;
}): Promise<Extract<IAutoMovieCaptureRecord, { state: "complete" }>> {
  const { plan } = props;
  const { layout, subject, request } = plan;
  const { folder } = props;
  if (folder.round !== request.round || folder.compare !== request.compare)
    throw new Error(
      `The capture folder was opened for round ${folder.round ?? "none"} compared with ${folder.compare ?? "none"}, but the plan asks for ${request.round ?? "none"} compared with ${request.compare ?? "none"}`,
    );

  // Claim every still and sheet before the first is written.
  const sheetNames: string[] = Array.from(
    { length: layout.sheets },
    (_: unknown, index: number): string =>
      `sheet-${String(index + 1).padStart(3, "0")}.png`,
  );
  await folder.claim([
    ...plan.cells.map((cell: IAutoMovieCaptureCell): string => `${cell.name}.png`),
    ...sheetNames,
  ]);

  // A label's font pixel stays at least one sheet pixel once the still is reduced into its cell.
  const labelScale: number = scaleAutoMovieCaptureLabels(subject, layout);

  // Draw, stamp, write and lay each cell in plan order.
  const rows: IAutoMovieCaptureRecord.Row[] = [];
  const sheets: string[] = [];
  let sheet: AutoMovieRasterSheet | null = null;
  for (const cell of plan.cells) {
    const place: Pick<IAutoMovieCaptureRecord.Row, "sheet" | "row" | "column"> = {
      sheet: sheetNames[Math.floor(cell.index / layout.perSheet)]!,
      row: Math.floor((cell.index % layout.perSheet) / layout.columns),
      column: (cell.index % layout.perSheet) % layout.columns,
    };
    const fixed: Pick<
      IAutoMovieCaptureRecord.Row,
      "index" | "name" | "selection" | "time" | "view" | "pass" | "label"
    > = {
      index: cell.index,
      name: cell.name,
      selection: cell.selection,
      time: cell.time,
      view: cell.view,
      pass: cell.pass,
      label: cell.label,
    };
    sheet ??= new AutoMovieRasterSheet(
      layout.perSheet,
      layout.columns,
      layout.cell.width,
      layout.cell.height,
      layout.reduction,
      layout.lines,
    );
    let drawing: IAutoMovieCaptureDrawing;
    try {
      drawing = await props.draw(cell);
      if (
        drawing.picture.width !== subject.width ||
        drawing.picture.height !== subject.height
      )
        throw new Error(
          `the draw returned ${drawing.picture.width}x${drawing.picture.height} pixels where the subject is ${subject.width}x${subject.height}`,
        );
    } catch (error) {
      const cause: string = error instanceof Error ? error.message : String(error);
      rows.push({ ...fixed, ...place, state: "failed", cause });
      sheet.add(markAutoMovieCaptureCell(layout.cell), `${cell.caption} not drawn`);
      sheet = await full(sheet, cell, folder, sheets, sheetNames, plan);
      continue;
    }
    const picture: IAutoMovieRasterImage = drawing.picture;
    for (const label of drawing.labels)
      stampAutoMovieRasterLabel(picture, label.text, labelScale, label);
    const file: string = `${cell.name}.png`;
    await folder.write(file, await encodeAutoMovieRasterPng(picture));
    rows.push({
      ...fixed,
      ...place,
      state: "drawn",
      file,
      hash: hashAutoMovieRasterImage(picture),
      backend: drawing.backend ?? null,
      camera: drawing.camera ?? null,
      resolved: drawing.resolved ?? null,
    });
    sheet.add(picture, cell.caption);
    sheet = await full(sheet, cell, folder, sheets, sheetNames, plan);
  }

  // The comparison, then the record.
  const comparison: IAutoMovieCaptureComparison | null =
    request.compare === null
      ? null
      : await compareAutoMovieCaptureRounds({
          folder,
          round: request.compare,
          rows,
          match: props.match,
          tolerance: request.tolerance,
          budget: request.budget,
          raster: { width: subject.width, height: subject.height },
        });
  return folder.close({
    subject: {
      name: subject.name,
      durationSeconds: subject.durationSeconds,
      fps: subject.fps,
      width: subject.width,
      height: subject.height,
    },
    revision: props.revision,
    request: formatAutoMovieCapturePlanRequest(request),
    budget: request.budget,
    layout,
    times: plan.times,
    windows: plan.windows,
    rows,
    sheets,
    comparison,
    video: props.video ?? null,
    section: props.section ?? null,
  });
}

/** Write the sheet when this cell filled it or was the plan's last, and hand back the sheet still being filled. */
async function full(
  sheet: AutoMovieRasterSheet,
  cell: IAutoMovieCaptureCell,
  folder: AutoMovieCaptureFolder,
  sheets: string[],
  names: readonly string[],
  plan: IAutoMovieCapturePlan,
): Promise<AutoMovieRasterSheet | null> {
  const last: boolean = cell.index === plan.cells.length - 1;
  if ((cell.index + 1) % plan.layout.perSheet !== 0 && !last) return sheet;
  const name: string = names[sheets.length]!;
  await folder.write(name, await encodeAutoMovieRasterPng(sheet.finish()));
  sheets.push(name);
  return null;
}
