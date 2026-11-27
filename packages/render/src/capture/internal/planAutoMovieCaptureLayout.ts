import type {
  IAutoMovieCaptureLayout,
  IAutoMovieCaptureLayoutProps,
} from "@automovie/interface";

import { AutoMovieRenderRasterSheet } from "../../picture/AutoMovieRenderRasterSheet.js";

/*
 * Lay out a capture's cells on contact sheets for a stated reader: every
 * sheet's longest edge within `budget.longest`, every cell's shorter edge at
 * least `budget.smallest`, and the cells as large as those two bounds allow.
 * Each cell's caption strip is reserved under it and counted against the
 * longest edge, never taken from the cell: it holds as many lines as the
 * longest of `captions` wraps to at the cell's width, by
 * `AutoMovieRenderRasterSheet.lines`, at the height
 * `AutoMovieRenderRasterSheet.caption` gives, so every caption keeps every word
 * that identifies its cell.
 *
 * A cell keeps the still's proportions, so a portrait still gives upright
 * cells, and never enlarges the still. The smallest cell decides how many cells
 * one sheet can hold; when the cells do not fit one sheet they are spread
 * evenly over as few sheets as hold them. Cells come in groups of `group`, such
 * as the views and passes of one instant: when a group fits a row, a sheet
 * holds whole groups and its column count is a multiple of the group, so each
 * row starts a new group and no group is split between sheets. Among the grids
 * that hold a sheet's cells, the one giving the largest cell wins, ties going
 * to the grid with fewer empty cells, then to the one with fewer rows. A still
 * so elongated that one smallest cell exceeds the longest edge is shrunk to fit
 * it, the one case where a cell falls under `smallest`, because a reader would
 * downsize a larger sheet anyway.
 *
 * It throws for a raster, count or group that is not a positive whole number.
 *
 * ```ts
 * planAutoMovieCaptureLayout({
 *   width: 1280,
 *   height: 720,
 *   count: 50,
 *   group: 1,
 *   budget: { longest: 1568, smallest: 200, reduction: "area" },
 *   captions: ["f30 1.000s"],
 * });
 * // cells of 366 x 206 with an 18 px caption strip, in 4 columns of 7 rows, 25 per sheet on 2 sheets
 * ```
 */
export function planAutoMovieCaptureLayout(
  props: IAutoMovieCaptureLayoutProps,
): IAutoMovieCaptureLayout {
  const { width, height, count, budget } = props;
  for (const [key, value] of Object.entries({
    width,
    height,
    count,
    group: props.group,
  }))
    if (!(value > 0))
      throw new Error(
        `A capture layout's ${key} ${value} is not a positive whole number`,
      );

  // The smallest cell the reader can read, never larger than the still.
  const least: number = Math.min(1, budget.smallest / Math.min(width, height));
  const columnsMost: number = Math.max(
    1,
    Math.floor(budget.longest / Math.ceil(width * least - EPSILON)),
  );
  const leastHeight: number = Math.ceil(height * least - EPSILON);

  // The caption strip under a cell: as many lines as the longest caption wraps to at the cell's width.
  const strip: (cell: number) => { lines: number; height: number } = (
    cell: number,
  ): { lines: number; height: number } => {
    const lines: number = AutoMovieRenderRasterSheet.lines(
      props.captions,
      Math.max(1, Math.floor((width * cell) / height + EPSILON)),
      cell,
    );
    return { lines, height: AutoMovieRenderRasterSheet.caption(cell, lines) };
  };
  const rowsMost: number = Math.max(
    1,
    Math.floor(budget.longest / (leastHeight + strip(leastHeight).height)),
  );

  // Spread whole groups evenly over the fewest sheets that hold them; a group wider than a row is not kept whole.
  const group: number = props.group <= columnsMost ? props.group : 1;
  const groups: number = Math.ceil(count / group);
  const groupsMost: number = Math.floor(columnsMost / group) * rowsMost;
  const sheets: number = Math.ceil(groups / groupsMost);
  const perSheet: number = Math.min(count, Math.ceil(groups / sheets) * group);

  // The grid with the largest cell among column counts that are multiples of the group.
  let best: {
    columns: number;
    rows: number;
    scale: number;
    cell: number;
  } | null = null;
  const widest: number = Math.min(
    Math.ceil(perSheet / group) * group,
    Math.floor(columnsMost / group) * group,
  );
  for (let columns: number = group; columns <= widest; columns += group) {
    const rows: number = Math.ceil(perSheet / columns);
    if (rows > rowsMost) continue;

    // The tallest cell the row's width allows, lowered until it and its caption strip fit the row's share of the longest edge.
    const rowHeight: number = Math.floor(budget.longest / rows);
    let cell: number = Math.max(
      1,
      Math.min(
        rowHeight,
        Math.floor(
          height * Math.min(1, budget.longest / (columns * width)) + EPSILON,
        ),
      ),
    );
    while (cell > 1 && cell + strip(cell).height > rowHeight) cell--;
    const scale: number = cell / height;
    if (
      best === null ||
      scale > best.scale ||
      (scale === best.scale &&
        (columns * rows < best.columns * best.rows ||
          (columns * rows === best.columns * best.rows && rows < best.rows)))
    )
      best = { columns, rows, scale, cell };
  }

  // The widest grid always fits, since a sheet holds no more whole groups than a row of them times the rows.
  if (best === null)
    throw new Error("A capture layout found no grid; this is a defect");
  return {
    cell: {
      width: Math.max(1, Math.floor(width * best.scale + EPSILON)),
      height: best.cell,
    },
    caption: strip(best.cell).height,
    lines: strip(best.cell).lines,
    columns: best.columns,
    rows: best.rows,
    perSheet,
    sheets,
    reduction: budget.reduction,
  };
}

/*
 * Slack for the rounding of a pixel size that is a whole number in exact
 * arithmetic, such as 720 × 200 / 720.
 */
const EPSILON: number = 1e-9;
