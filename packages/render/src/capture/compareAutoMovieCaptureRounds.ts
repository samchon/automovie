import type {
  IAutoMovieCaptureCellComparison,
  IAutoMovieCaptureCellRecord,
  IAutoMovieCaptureComparison,
  IAutoMovieCaptureComparisonProps,
  IAutoMovieCaptureLayout,
  IAutoMovieCaptureRecord,
  IAutoMovieRasterComparison,
  IAutoMovieRasterImage,
} from "@automovie/interface";

import { AutoMovieRasterSheet } from "../picture/AutoMovieRasterSheet.js";
import { compareAutoMovieRasters } from "../picture/compareAutoMovieRasters.js";
import { decodeAutoMovieRasterPng } from "../picture/decodeAutoMovieRasterPng.js";
import { encodeAutoMovieRasterPng } from "../picture/encodeAutoMovieRasterPng.js";
import { diffAutoMovieCaptureFindings } from "./diffAutoMovieCaptureFindings.js";
import { markAutoMovieCaptureCell } from "./markAutoMovieCaptureCell.js";
import { planAutoMovieCaptureLayout } from "./planAutoMovieCaptureLayout.js";

/** The sides shown on one comparison row and any reason they could not pair. */
interface IRowPair {
  /** The earlier still, if this entry represents one. */
  earlier: IAutoMovieCaptureCellRecord | null;

  /** This capture's still, if this entry represents one. */
  current: IAutoMovieCaptureCellRecord | null;

  /** Why a row with no counterpart stayed unmatched, if known. */
  cause?: string;
}

/** Every row from both captures at one matching key. */
interface IRowGroup {
  /** The earlier capture rows, in plan order. */
  earlier: IAutoMovieCaptureCellRecord[];

  /** The current capture rows, in plan order. */
  current: IAutoMovieCaptureCellRecord[];
}

/**
 * Compare the cells a capture just wrote against an earlier round's, write a
 * difference image for every changed pair, and lay every pair on comparison
 * sheets.
 *
 * Under `cell`, two cells pair when their selection, second, view and pass
 * agree; when both state a resolved camera and the cameras differ, the cells
 * stay unmatched, because a view that fits itself to its subject can resolve to
 * another camera. Under `time`, cells pair by second, pass and selection. A
 * unique pair may have different views, as when an encoded file is compared
 * with its drawn source. Where a key repeats, only unique equal views pair.
 * Surplus, incompatible or ambiguous rows are reported as unmatched. A pair
 * whose stills name the same backend is measured by `compareAutoMovieRasters`
 * at `tolerance`, and a changed pair gets `diff-<name>.png`, the newer picture
 * dimmed with every changed pixel in magenta. A pair drawn by different or
 * unstated backends is laid side by side without a difference image. A cell
 * either capture failed to draw, a cell only one capture holds and a measured
 * pair whose rasters differ are unmatched, each with the cause.
 *
 * The findings of the two rounds are compared by diffAutoMovieCaptureFindings,
 * from the earlier record's diagnostics and this round's, which the caller
 * reduces first.
 *
 * Each entry takes three consecutive cells of the comparison sheets, the
 * earlier still, this capture's still and the difference image, with a marked
 * cell where a side or the difference is missing; rows and sheets hold whole
 * entries, laid out for `budget` and named `comparison-001.png` onwards.
 */
export async function compareAutoMovieCaptureRounds(
  props: IAutoMovieCaptureComparisonProps,
): Promise<IAutoMovieCaptureComparison> {
  const { folder, match } = props;
  const earlier: Extract<
    IAutoMovieCaptureRecord,
    { state: "complete" }
  > | null = folder.earlier;
  if (earlier === null)
    throw new Error(
      "A capture compares only with a folder opened against a round",
    );

  // Select counterparts without losing repeated or incompatible rows.
  const pairs: IRowPair[] = pairRows(
    props.round,
    match,
    earlier.rows,
    props.rows,
  );

  // Claim every file the comparison may write before writing any.
  const layout: IAutoMovieCaptureLayout = planAutoMovieCaptureLayout({
    width: props.raster.width,
    height: props.raster.height,
    count: Math.max(1, pairs.length * 3),
    group: 3,
    budget: props.budget,
    // Every caption a comparison row can carry: each side's name, and the longest third caption.
    captions: pairs.flatMap(
      ({ earlier: old, current: now }: IRowPair): string[] => [
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
    ...props.rows.map(
      (row: IAutoMovieCaptureCellRecord): string => `diff-${row.name}.png`,
    ),
    ...sheetNames,
  ]);

  // Measure each pair and lay it on the sheets.
  const entries: IAutoMovieCaptureCellComparison[] = [];
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
  for (const { earlier: old, current: now, cause } of pairs) {
    const entry: IAutoMovieCaptureCellComparison = decide(
      props.round,
      match,
      old,
      now,
      cause,
    );
    const oldPicture: IAutoMovieRasterImage | null =
      old?.state === "drawn"
        ? await decodeAutoMovieRasterPng(await folder.read(old.file, true))
        : null;
    const nowPicture: IAutoMovieRasterImage | null =
      now?.state === "drawn"
        ? await decodeAutoMovieRasterPng(await folder.read(now.file))
        : null;
    let difference: IAutoMovieRasterImage | null = null;
    let final: IAutoMovieCaptureCellComparison = entry;
    if (
      entry.state === "paired" &&
      entry.mode === "difference" &&
      oldPicture !== null &&
      nowPicture !== null
    ) {
      if (
        oldPicture.width !== nowPicture.width ||
        oldPicture.height !== nowPicture.height
      )
        final = {
          state: "unmatched",
          current: entry.current,
          earlier: entry.earlier,
          cause: `the rasters differ: ${oldPicture.width}x${oldPicture.height} in round ${props.round} against ${nowPicture.width}x${nowPicture.height}`,
        };
      else {
        const measured: IAutoMovieRasterComparison = compareAutoMovieRasters(
          oldPicture,
          nowPicture,
          props.tolerance,
        );
        const file: string | null =
          measured.changed > 0 ? `diff-${entry.current}.png` : null;
        if (file !== null) {
          await folder.write(
            file,
            await encodeAutoMovieRasterPng(measured.image),
          );
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
  return {
    round: props.round,
    match,
    tolerance: props.tolerance,
    entries,
    sheets,
    findings: diffAutoMovieCaptureFindings({
      earlier: earlier.diagnostics,
      current: props.diagnostics,
    }),
  };
}

/** Index every occurrence of a row key, keeping the two captures distinct. */
function groupRows(
  rows: Readonly<{
    earlier: readonly IAutoMovieCaptureCellRecord[];
    current: readonly IAutoMovieCaptureCellRecord[];
  }>,
  key: (row: IAutoMovieCaptureCellRecord) => string,
): Map<string, IRowGroup> {
  const groups: Map<string, IRowGroup> = new Map();
  for (const side of ["earlier", "current"] as const)
    for (const row of rows[side]) {
      const name: string = key(row);
      let group: IRowGroup | undefined = groups.get(name);
      if (group === undefined) {
        group = { earlier: [], current: [] };
        groups.set(name, group);
      }
      group[side].push(row);
    }
  return groups;
}

/** One capture-clock address, in seconds rounded to comparison precision. */
function second(row: IAutoMovieCaptureCellRecord): string {
  return row.time.seconds.toFixed(6);
}

/** Pair uniquely comparable rows and keep every other row in its plan order. */
function pairRows(
  round: string,
  match: IAutoMovieCaptureComparisonProps["match"],
  earlier: readonly IAutoMovieCaptureCellRecord[],
  current: readonly IAutoMovieCaptureCellRecord[],
): IRowPair[] {
  const groups: Map<string, IRowGroup> = groupRows(
    { earlier, current },
    (row: IAutoMovieCaptureCellRecord): string =>
      JSON.stringify([
        second(row),
        row.pass,
        row.selection.kind,
        row.selection.kind === "whole"
          ? row.selection.parts
          : row.selection.unit,
        match === "cell" ? row.view : null,
      ]),
  );
  const earlierSeconds: Set<string> | null =
    match === "time" ? new Set(earlier.map(second)) : null;
  const currentSeconds: Set<string> | null =
    match === "time" ? new Set(current.map(second)) : null;
  const matched: Set<IAutoMovieCaptureCellRecord> = new Set();
  const counterparts: Map<
    IAutoMovieCaptureCellRecord,
    IAutoMovieCaptureCellRecord
  > = new Map();
  const causes: Map<IAutoMovieCaptureCellRecord, string> = new Map();

  /**
   * A repeated key has no one-to-one match until another known field
   * distinguishes it.
   */
  const pairUnique = (group: IRowGroup): boolean => {
    if (group.earlier.length !== 1 || group.current.length !== 1) return false;
    matched.add(group.earlier[0]!);
    counterparts.set(group.current[0]!, group.earlier[0]!);
    return true;
  };
  for (const group of groups.values()) {
    if (pairUnique(group)) continue;
    if (
      match === "time" &&
      group.earlier.length > 0 &&
      group.current.length > 0
    )
      for (const views of groupRows(
        group,
        (row: IAutoMovieCaptureCellRecord): string => row.view,
      ).values())
        pairUnique(views);

    const oldOnly: IAutoMovieCaptureCellRecord[] = group.earlier.filter(
      (row: IAutoMovieCaptureCellRecord): boolean => !matched.has(row),
    );
    const currentOnly: IAutoMovieCaptureCellRecord[] = group.current.filter(
      (row: IAutoMovieCaptureCellRecord): boolean => !counterparts.has(row),
    );
    if (oldOnly.length > 0 && currentOnly.length > 0) {
      for (const row of [...oldOnly, ...currentOnly])
        causes.set(row, "the comparison is ambiguous at this second");
      continue;
    }
    for (const row of oldOnly)
      if (currentSeconds?.has(second(row)))
        causes.set(
          row,
          "this capture has no remaining cell with the same pass and selection at this second",
        );
    for (const row of currentOnly)
      if (earlierSeconds?.has(second(row)))
        causes.set(
          row,
          `round ${round} has no remaining cell with the same pass and selection at this second`,
        );
  }
  return [
    ...current.map(
      (row: IAutoMovieCaptureCellRecord): IRowPair => ({
        earlier: counterparts.get(row) ?? null,
        current: row,
        cause: causes.get(row),
      }),
    ),
    ...earlier
      .filter((row: IAutoMovieCaptureCellRecord): boolean => !matched.has(row))
      .map(
        (row: IAutoMovieCaptureCellRecord): IRowPair => ({
          earlier: row,
          current: null,
          cause: causes.get(row),
        }),
      ),
  ];
}

/** Whether two rows pair, and in which mode, before any pixel is read. */
function decide(
  round: string,
  match: "cell" | "time",
  old: IAutoMovieCaptureCellRecord | null,
  now: IAutoMovieCaptureCellRecord | null,
  cause: string | undefined,
): IAutoMovieCaptureCellComparison {
  const unmatched: (cause: string) => IAutoMovieCaptureCellComparison = (
    cause: string,
  ): IAutoMovieCaptureCellComparison => ({
    state: "unmatched",
    current: now?.name ?? null,
    earlier: old?.name ?? null,
    cause,
  });
  if (cause !== undefined) return unmatched(cause);
  if (old === null) return unmatched(`round ${round} has no such cell`);
  if (now === null) return unmatched("this capture has no such cell");
  if (old.state === "failed")
    return unmatched(`round ${round} did not draw it: ${old.cause}`);
  if (now.state === "failed")
    return unmatched(`this capture did not draw it: ${now.cause}`);
  if (
    match === "cell" &&
    old.camera !== null &&
    now.camera !== null &&
    old.camera !== now.camera
  )
    return unmatched(
      `the resolved cameras differ: ${old.camera} in round ${round} against ${now.camera}`,
    );
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
    : {
        state: "paired",
        mode: "side-by-side",
        current: now.name,
        earlier: old.name,
      };
}
