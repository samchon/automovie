import type { IAutoMovieCaptureBudget } from "./IAutoMovieCaptureBudget.js";
import type { IAutoMovieCaptureLayout } from "./IAutoMovieCaptureLayout.js";

/** Slack for the rounding of a pixel size that is a whole number in exact arithmetic, such as 720 × 200 / 720. */
const EPSILON: number = 1e-9;

/**
 * Lay out a capture's cells on contact sheets for a stated reader: every sheet's longest edge within `budget.longest`, every cell's shorter edge at least `budget.smallest`, and the cells as large as those two bounds allow.
 *
 * A cell keeps the still's proportions, so a portrait still gives upright cells, and never enlarges the still. The smallest cell decides how many cells one sheet can hold; when the cells do not fit one sheet they are spread evenly over as few sheets as hold them. Cells come in groups of `group`, such as the views and passes of one instant: when a group fits a row, a sheet holds whole groups and its column count is a multiple of the group, so each row starts a new group and no group is split between sheets. Among the grids that hold a sheet's cells, the one giving the largest cell wins, ties going to the grid with fewer empty cells, then to the one with fewer rows. A still so elongated that one smallest cell exceeds the longest edge is shrunk to fit it, the one case where a cell falls under `smallest`, because a reader would downsize a larger sheet anyway.
 *
 * It throws for a raster, count or group that is not a positive whole number.
 *
 * ```ts
 * planAutoMovieCaptureLayout({ width: 1280, height: 720, count: 50, group: 1, budget: { longest: 1568, smallest: 200, reduction: "area" } });
 * // cells of 392 x 220 in 4 columns, 25 per sheet on 2 sheets
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both bounds, the proportion and no-enlargement rules, how cells and groups are spread over sheets, which grid wins, the one case that breaks the smallest edge and why, and the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation A sheet holds at most floor(longest / smallest-cell-width) by floor(longest / smallest-cell-height) cells; spreading the count evenly over the fewest such sheets and then choosing the grid by its scale, min(1, longest / (columns × width), longest / (rows × height)), maximises the cell size within both bounds. The smallest cell's sides are rounded up, so a grid that fits it keeps the shorter edge at `smallest`, and the chosen cell's sides are floored, so the sheet never exceeds the longest edge; both allow `1e-9` for floating-point error in a size that is whole in exact arithmetic.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Size the smallest cell, count sheets in whole groups, then one search over column counts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No cell size, column count or sheet size is fixed: every number comes from the budget, the raster and the group.
 * @evidence contracts/development/implementation.md#efficient-algorithms The search tries at most one grid per column count, bounded by `longest / smallest`, independent of the count and of the still's pixels.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of a few numbers.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one small record and keeps nothing.
 */
export function planAutoMovieCaptureLayout(props: {
  /** Still width in pixels. */
  width: number;

  /** Still height in pixels. */
  height: number;

  /** Number of cells, at least one. */
  count: number;

  /** Cells that belong together in a row, such as the views and passes of one instant, at least one. */
  group: number;

  /** The reader the sheets are for. */
  budget: IAutoMovieCaptureBudget;
}): IAutoMovieCaptureLayout {
  const { width, height, count, budget } = props;
  for (const [key, value] of Object.entries({
    width,
    height,
    count,
    group: props.group,
  }))
    if (!(Number.isSafeInteger(value) && value > 0))
      throw new Error(
        `A capture layout's ${key} ${value} is not a positive whole number`,
      );

  // The smallest cell the reader can read, never larger than the still.
  const least: number = Math.min(1, budget.smallest / Math.min(width, height));
  const columnsMost: number = Math.max(
    1,
    Math.floor(budget.longest / Math.ceil(width * least - EPSILON)),
  );
  const rowsMost: number = Math.max(
    1,
    Math.floor(budget.longest / Math.ceil(height * least - EPSILON)),
  );

  // Spread whole groups evenly over the fewest sheets that hold them; a group wider than a row is not kept whole.
  const group: number = props.group <= columnsMost ? props.group : 1;
  const groups: number = Math.ceil(count / group);
  const groupsMost: number = Math.floor(columnsMost / group) * rowsMost;
  const sheets: number = Math.ceil(groups / groupsMost);
  const perSheet: number = Math.min(count, Math.ceil(groups / sheets) * group);

  // The grid with the largest cell among column counts that are multiples of the group.
  let best: { columns: number; rows: number; scale: number } | null = null;
  const widest: number = Math.min(
    Math.ceil(perSheet / group) * group,
    Math.floor(columnsMost / group) * group,
  );
  for (let columns: number = group; columns <= widest; columns += group) {
    const rows: number = Math.ceil(perSheet / columns);
    if (rows > rowsMost) continue;
    const scale: number = Math.min(
      1,
      budget.longest / (columns * width),
      budget.longest / (rows * height),
    );
    if (
      best === null ||
      scale > best.scale ||
      (scale === best.scale &&
        (columns * rows < best.columns * best.rows ||
          (columns * rows === best.columns * best.rows && rows < best.rows)))
    )
      best = { columns, rows, scale };
  }

  // The widest grid always fits, since a sheet holds no more whole groups than a row of them times the rows.
  if (best === null)
    throw new Error("A capture layout found no grid; this is a defect");
  return {
    cell: {
      width: Math.max(1, Math.floor(width * best.scale + EPSILON)),
      height: Math.max(1, Math.floor(height * best.scale + EPSILON)),
    },
    columns: best.columns,
    rows: best.rows,
    perSheet,
    sheets,
    reduction: budget.reduction,
  };
}
