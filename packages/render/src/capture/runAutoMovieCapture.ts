import { AutoMovieEnginePicture } from "@automovie/engine";
import type {
  IAutoMovieCaptureCell,
  IAutoMovieCaptureCellRecord,
  IAutoMovieCaptureComparison,
  IAutoMovieCaptureDrawing,
  IAutoMovieCaptureFolder,
  IAutoMovieCapturePlan,
  IAutoMovieCaptureRecord,
  IAutoMovieInspectionDiagnostics,
  IAutoMovieRasterImage,
  IAutoMovieRunCaptureProps,
} from "@automovie/interface";

import { AutoMovieRenderPicture } from "../picture/AutoMovieRenderPicture.js";
import { AutoMovieRenderRasterSheet } from "../picture/AutoMovieRenderRasterSheet.js";
import { reduceAutoMovieInspectionEpisodes } from "../scene/inspection/reduceAutoMovieInspectionEpisodes.js";
import { compareAutoMovieCaptureRounds } from "./compareAutoMovieCaptureRounds.js";
import { formatAutoMovieCapturePlanRequest } from "./formatAutoMovieCapturePlanRequest.js";
import { markAutoMovieCaptureCell } from "./markAutoMovieCaptureCell.js";
import { scaleAutoMovieCaptureLabels } from "./scaleAutoMovieCaptureLabels.js";

/**
 * Draw a planned capture through the host's draw function and write its stills,
 * contact sheets and record into its opened folder, so every rule of a capture
 * runs the same in a Node host, a page and a test.
 *
 * Each cell is drawn in plan order, one at a time. A drawn still gets its
 * labels stamped at their anchors, at a scale that keeps a label's font pixel
 * at least one sheet pixel after the still is reduced into its cell, and is
 * written as `<cell name>.png` with its content hash, RGB except a `graphics`
 * still, which keeps its straight alpha as RGBA. A cell whose draw throws, or
 * returns a picture that is not the subject's raster, is recorded with the
 * cause and stands on the sheet as a marked cell, and the run continues. Sheets
 * are written as `sheet-001.png` onwards as each fills. Diagnostics supplied by
 * the drawn cells are reduced in film time for the record. With a `compare`
 * round, `compareAutoMovieCaptureRounds` follows at `match` and diffs those
 * findings against the earlier record's. The record comes last.
 *
 * Files are touched in the order `AutoMovieCaptureFolder` states: the host
 * opens the folder for the plan's round and compared round, which checks both
 * before anything is deleted; every still and sheet is claimed in a `running`
 * record before the first is written, the comparison's files are claimed before
 * it writes, and the `complete` record is written last. It rejects a folder
 * opened for another round, and a storage failure, leaving a record that owns
 * every file written so far.
 *
 * ```ts
 * const plan = planAutoMovieCapture({ request, subject, cuts: [] });
 * const folder = await AutoMovieCaptureFolder.open({
 *   storage: fs,
 *   root: "media/capture",
 *   round: request.round,
 *   compare: request.compare,
 * });
 * const record = await runAutoMovieCapture({
 *   plan,
 *   draw,
 *   folder,
 *   revision,
 *   match: "cell",
 * });
 * ```
 */
export async function runAutoMovieCapture(
  props: IAutoMovieRunCaptureProps,
): Promise<Extract<IAutoMovieCaptureRecord, { state: "complete" }>> {
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
    ...plan.cells.map(
      (cell: IAutoMovieCaptureCell): string => `${cell.name}.png`,
    ),
    ...sheetNames,
  ]);

  // A label's font pixel stays at least one sheet pixel once the still is reduced into its cell.
  const labelScale: number = scaleAutoMovieCaptureLabels(subject, layout);

  // Draw, stamp, write and lay each cell in plan order.
  const rows: IAutoMovieCaptureCellRecord[] = [];
  const packets: IAutoMovieInspectionDiagnostics[] = [];
  const sheets: string[] = [];
  let sheet: AutoMovieRenderRasterSheet | null = null;
  for (const cell of plan.cells) {
    const place: Pick<IAutoMovieCaptureCellRecord, "sheet" | "row" | "column"> =
      {
        sheet: sheetNames[Math.floor(cell.index / layout.perSheet)]!,
        row: Math.floor((cell.index % layout.perSheet) / layout.columns),
        column: (cell.index % layout.perSheet) % layout.columns,
      };
    const fixed: Pick<
      IAutoMovieCaptureCellRecord,
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
    sheet ??= new AutoMovieRenderRasterSheet(
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
      const { diagnostics } = drawing;
      if (diagnostics !== undefined) {
        const outputFrame: number | undefined = cell.time.frame ?? undefined;
        const { time } = diagnostics;
        if (
          time.filmSeconds !== cell.time.seconds ||
          (time.outputFrame !== undefined && time.outputFrame !== outputFrame)
        )
          throw new Error(
            `Inspection diagnostics do not match cell ${cell.name} at ${cell.time.seconds} s.`,
          );
        packets.push(
          outputFrame === undefined
            ? diagnostics
            : {
                ...diagnostics,
                time: { ...time, outputFrame },
              },
        );
      }
    } catch (error) {
      const cause: string =
        error instanceof Error ? error.message : String(error);
      rows.push({ ...fixed, ...place, state: "failed", cause });
      sheet.add(
        markAutoMovieCaptureCell(layout.cell),
        `${cell.caption} not drawn`,
      );
      sheet = await full(sheet, cell, folder, sheets, sheetNames, plan);
      continue;
    }
    const picture: IAutoMovieRasterImage = drawing.picture;
    for (const label of drawing.labels)
      AutoMovieRenderPicture.stampRasterLabel(
        picture,
        label.text,
        labelScale,
        label,
      );
    const file: string = `${cell.name}.png`;
    // The graphics plate keeps its straight alpha as the compositing matte.
    const bytes: Uint8Array = await AutoMovieRenderPicture.encodeRasterPng(
      picture,
      {
        alpha: cell.pass === "graphics",
      },
    );
    await folder.write(file, bytes);
    rows.push({
      ...fixed,
      ...place,
      state: "drawn",
      file,
      hash: AutoMovieRenderPicture.hashRasterImage(picture),
      fileSha256: AutoMovieEnginePicture.digestAutoMovieBytes(bytes).slice("sha256:".length),
      backend: drawing.backend ?? null,
      camera: drawing.camera ?? null,
      repeat: drawing.repeat ?? null,
      resolved: drawing.resolved ?? null,
    });
    sheet.add(picture, cell.caption);
    sheet = await full(sheet, cell, folder, sheets, sheetNames, plan);
  }

  // The findings, which the comparison diffs, then the comparison, then the record.
  const diagnostics: IAutoMovieInspectionDiagnostics.IAudit | undefined =
    packets.length === 0
      ? undefined
      : reduceAutoMovieInspectionEpisodes(
          packets.sort(
            (
              left: IAutoMovieInspectionDiagnostics,
              right: IAutoMovieInspectionDiagnostics,
            ): number => left.time.filmSeconds - right.time.filmSeconds,
          ),
        );
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
          ...(diagnostics === undefined ? {} : { diagnostics }),
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
    ...(diagnostics === undefined ? {} : { diagnostics }),
  });
}

/**
 * Write the sheet when this cell filled it or was the plan's last, and hand
 * back the sheet still being filled.
 */
async function full(
  sheet: AutoMovieRenderRasterSheet,
  cell: IAutoMovieCaptureCell,
  folder: IAutoMovieCaptureFolder,
  sheets: string[],
  names: readonly string[],
  plan: IAutoMovieCapturePlan,
): Promise<AutoMovieRenderRasterSheet | null> {
  const last: boolean = cell.index === plan.cells.length - 1;
  if ((cell.index + 1) % plan.layout.perSheet !== 0 && !last) return sheet;
  const name: string = names[sheets.length]!;
  await folder.write(
    name,
    await AutoMovieRenderPicture.encodeRasterPng(sheet.finish()),
  );
  sheets.push(name);
  return null;
}
