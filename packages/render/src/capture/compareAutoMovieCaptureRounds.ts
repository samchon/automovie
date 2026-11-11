import { AutoMovieRasterSheet } from "../picture/AutoMovieRasterSheet.js";
import { compareAutoMovieRasters } from "../picture/compareAutoMovieRasters.js";
import type { IAutoMovieRasterComparison } from "../picture/IAutoMovieRasterComparison.js";
import type { IAutoMovieRasterImage } from "../picture/IAutoMovieRasterImage.js";
import type { AutoMovieCaptureFolder } from "./AutoMovieCaptureFolder.js";
import { decodeAutoMovieRasterPng } from "../picture/decodeAutoMovieRasterPng.js";
import { encodeAutoMovieRasterPng } from "../picture/encodeAutoMovieRasterPng.js";
import type { IAutoMovieCaptureBudget } from "./IAutoMovieCaptureBudget.js";
import type { IAutoMovieCaptureComparison } from "./IAutoMovieCaptureComparison.js";
import type { IAutoMovieCaptureLayout } from "./IAutoMovieCaptureLayout.js";
import type { IAutoMovieCaptureRecord } from "./IAutoMovieCaptureRecord.js";
import { markAutoMovieCaptureCell } from "./markAutoMovieCaptureCell.js";
import { planAutoMovieCaptureLayout } from "./planAutoMovieCaptureLayout.js";


/**
 * Compare the cells a capture just wrote against an earlier round's, write a difference image for every changed pair, and lay every pair on comparison sheets.
 *
 * Under `cell`, two cells pair when their selection, second, view and pass agree; when both state a resolved camera and the cameras differ, the cells stay unmatched, because a view that fits itself to its subject can resolve to another camera. Under `time`, cells pair by second alone, as an encoded file against the source drawn at the same seconds. A pair whose stills name the same backend is measured by `compareAutoMovieRasters` at `tolerance`, and a changed pair gets `diff-<name>.png`, the newer picture dimmed with every changed pixel in magenta. A pair drawn by different or unstated backends is laid side by side without a difference image. A cell either capture failed to draw, a cell only one capture holds and a measured pair whose rasters differ are unmatched, each with the cause.
 *
 * Each entry takes three consecutive cells of the comparison sheets, the earlier still, this capture's still and the difference image, with a marked cell where a side or the difference is missing; rows and sheets hold whole entries, laid out for `budget` and named `comparison-001.png` onwards.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both matching rules and why the camera matters, when a pair is measured or laid side by side, every unmatched cause, what a sheet row holds and what files are written.
 * @evidence contracts/development/implementation.md#principled-implementation `.agents/skills/visual-debugging/comparison.md`: pair two cells only when everything but the compared thing agrees, and report a cell one capture lacks as unmatched with its cause; the campaign's renderer decision compares pixels only within one backend, since bit identity across backends is not documented.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Index the earlier rows by their key, decide every entry, claim the files, then read, measure and lay out each entry in order.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No picture is resampled to force a comparison, and an unmatched cell is never counted as unchanged.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the cells of both captures for the pairing, plus each pair's pixels once for decoding and measuring.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each pair is read and measured once.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One pair of decoded stills, one difference image and the comparison sheet being filled are held at a time.
 */
export async function compareAutoMovieCaptureRounds(props: {
  /** The capture's folder, opened with the earlier round to compare against. */
  folder: AutoMovieCaptureFolder;

  /** Name of the earlier round. */
  round: string;

  /** This capture's rows, in plan order. */
  rows: readonly IAutoMovieCaptureRecord.Row[];

  /** How cells are paired. */
  match: "cell" | "time";

  /** Largest channel difference in bytes counted as unchanged. */
  tolerance: number;

  /** The reader the comparison sheets are laid out for. */
  budget: IAutoMovieCaptureBudget;

  /** This capture's still raster in pixels, which sizes the sheet cells. */
  raster: { width: number; height: number };
}): Promise<IAutoMovieCaptureComparison> {
  const { folder, match } = props;
  const earlier: Extract<IAutoMovieCaptureRecord, { state: "complete" }> | null =
    folder.earlier;
  if (earlier === null)
    throw new Error("A capture compares only with a folder opened against a round");

  // Pair rows by the values that must agree.
  const key: (row: IAutoMovieCaptureRecord.Row) => string = (
    row: IAutoMovieCaptureRecord.Row,
  ): string =>
    match === "time"
      ? row.time.seconds.toFixed(6)
      : JSON.stringify([
          row.selection.kind,
          row.selection.kind === "whole" ? row.selection.parts : row.selection.unit,
          row.time.seconds.toFixed(6),
          row.view,
          row.pass,
        ]);
  const before: Map<string, IAutoMovieCaptureRecord.Row> = new Map(
    earlier.rows.map((row: IAutoMovieCaptureRecord.Row): [string, IAutoMovieCaptureRecord.Row] => [key(row), row]),
  );
  const pairs: [IAutoMovieCaptureRecord.Row | null, IAutoMovieCaptureRecord.Row | null][] = [];
  for (const row of props.rows) {
    const other: IAutoMovieCaptureRecord.Row | undefined = before.get(key(row));
    before.delete(key(row));
    pairs.push([other ?? null, row]);
  }
  for (const row of before.values()) pairs.push([row, null]);

  // Claim every file the comparison may write before writing any.
  const layout: IAutoMovieCaptureLayout = planAutoMovieCaptureLayout({
    width: props.raster.width,
    height: props.raster.height,
    count: Math.max(1, pairs.length * 3),
    group: 3,
    budget: props.budget,
    // Every caption a comparison row can carry: each side's name, and the longest third caption.
    captions: pairs.flatMap(
      ([old, now]: [IAutoMovieCaptureRecord.Row | null, IAutoMovieCaptureRecord.Row | null]): string[] => [
        `${props.round} ${old?.name ?? "missing"}`,
        `now ${now?.name ?? "missing"}`,
        `changed ${props.raster.width * props.raster.height}`,
        "side by side",
      ],
    ),
  });
  const sheetNames: string[] = Array.from(
    { length: layout.sheets },
    (_: unknown, index: number): string =>
      `comparison-${String(index + 1).padStart(3, "0")}.png`,
  );
  await folder.claim([
    ...props.rows.map((row: IAutoMovieCaptureRecord.Row): string => `diff-${row.name}.png`),
    ...sheetNames,
  ]);

  // Measure each pair and lay it on the sheets.
  const entries: IAutoMovieCaptureComparison.Entry[] = [];
  const sheets: string[] = [];
  let sheet: AutoMovieRasterSheet | null = null;
  let filled: number = 0;
  const flush: () => Promise<void> = async (): Promise<void> => {
    if (sheet === null) return;
    const name: string = sheetNames[sheets.length]!;
    const picture: IAutoMovieRasterImage = sheet.finish();
    sheet = null;
    await folder.write(name, await encodeAutoMovieRasterPng(picture));
    sheets.push(name);
  };
  const lay: (
    picture: IAutoMovieRasterImage | null,
    caption: string,
  ) => Promise<void> = async (
    picture: IAutoMovieRasterImage | null,
    caption: string,
  ): Promise<void> => {
    sheet ??= new AutoMovieRasterSheet(
      layout.perSheet,
      layout.columns,
      layout.cell.width,
      layout.cell.height,
      layout.reduction,
      layout.lines,
    );
    sheet.add(picture ?? markAutoMovieCaptureCell(layout.cell), caption);
    filled++;
    if (filled % layout.perSheet === 0) await flush();
  };
  for (const [old, now] of pairs) {
    const entry: IAutoMovieCaptureComparison.Entry = decide(props.round, match, old, now);
    const oldPicture: IAutoMovieRasterImage | null =
      old?.state === "drawn" ? await decodeAutoMovieRasterPng(await folder.read(old.file, true)) : null;
    const nowPicture: IAutoMovieRasterImage | null =
      now?.state === "drawn" ? await decodeAutoMovieRasterPng(await folder.read(now.file)) : null;
    let difference: IAutoMovieRasterImage | null = null;
    let final: IAutoMovieCaptureComparison.Entry = entry;
    if (entry.state === "paired" && entry.mode === "difference" && oldPicture !== null && nowPicture !== null) {
      if (oldPicture.width !== nowPicture.width || oldPicture.height !== nowPicture.height)
        final = {
          state: "unmatched",
          current: entry.current,
          earlier: entry.earlier,
          cause: `the rasters differ: ${oldPicture.width}x${oldPicture.height} in round ${props.round} against ${nowPicture.width}x${nowPicture.height}`,
        };
      else {
        const measured: IAutoMovieRasterComparison = compareAutoMovieRasters(oldPicture, nowPicture, props.tolerance);
        const file: string | null = measured.changed > 0 ? `diff-${entry.current}.png` : null;
        if (file !== null) {
          await folder.write(file, await encodeAutoMovieRasterPng(measured.image));
          difference = measured.image;
        }
        final = {
          ...entry,
          changed: measured.changed,
          ratio: measured.ratio,
          maximum: measured.maximum,
          bounds: measured.bounds,
          difference: file,
        };
      }
    }
    entries.push(final);
    await lay(oldPicture, `${props.round} ${old?.name ?? "missing"}`);
    await lay(nowPicture, `now ${now?.name ?? "missing"}`);
    await lay(
      difference,
      final.state === "unmatched"
        ? "unmatched"
        : final.mode === "side-by-side"
          ? "side by side"
          : `changed ${final.changed}`,
    );
  }
  if (filled % layout.perSheet !== 0) await flush();
  return { round: props.round, match, tolerance: props.tolerance, entries, sheets };
}

/** Whether two rows pair, and in which mode, before any pixel is read. */
function decide(
  round: string,
  match: "cell" | "time",
  old: IAutoMovieCaptureRecord.Row | null,
  now: IAutoMovieCaptureRecord.Row | null,
): IAutoMovieCaptureComparison.Entry {
  const unmatched: (cause: string) => IAutoMovieCaptureComparison.Entry = (
    cause: string,
  ): IAutoMovieCaptureComparison.Entry => ({
    state: "unmatched",
    current: now?.name ?? null,
    earlier: old?.name ?? null,
    cause,
  });
  if (old === null) return unmatched(`round ${round} has no such cell`);
  if (now === null) return unmatched("this capture has no such cell");
  if (old.state === "failed")
    return unmatched(`round ${round} did not draw it: ${old.cause}`);
  if (now.state === "failed")
    return unmatched(`this capture did not draw it: ${now.cause}`);
  if (match === "cell" && old.camera !== null && now.camera !== null && old.camera !== now.camera)
    return unmatched(`the resolved cameras differ: ${old.camera} in round ${round} against ${now.camera}`);
  return old.backend !== null && old.backend === now.backend
    ? {
        state: "paired",
        mode: "difference",
        current: now.name,
        earlier: old.name,
        changed: 0,
        ratio: 0,
        maximum: 0,
        bounds: null,
        difference: null,
      }
    : { state: "paired", mode: "side-by-side", current: now.name, earlier: old.name };
}
