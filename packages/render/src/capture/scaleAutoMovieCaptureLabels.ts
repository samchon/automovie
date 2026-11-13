import type { IAutoMovieCaptureLayout } from "./IAutoMovieCaptureLayout.js";

/**
 * The font pixel size, in still pixels, at which a capture stamps labels on a still: large enough that one font pixel stays at least one sheet pixel once the still is reduced into its cell, and never below one.
 *
 * A still of `width` by `height` is reduced into a cell of the layout, so the reduction is the ratio of their shorter sides, and a font pixel of that many still pixels survives it. The capture run stamps at this scale, and a draw page places its labels at the same scale so labels it keeps apart stay apart once stamped.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the unit, the rule and its floor, and both users.
 * @evidence contracts/development/implementation.md#principled-implementation An area reduction by a factor `k` maps `k` still pixels onto one sheet pixel, so a font pixel of `ceil(k)` still pixels covers at least one sheet pixel; the shorter sides bound the reduction because the cell keeps the still's aspect.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression, shared by the run and the draw call planner so both use one scale.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No fixed size: the scale follows the still and the reader's cell.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure expression.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a number.
 */
export function scaleAutoMovieCaptureLabels(
  raster: { width: number; height: number },
  layout: Pick<IAutoMovieCaptureLayout, "cell">,
): number {
  return Math.max(
    1,
    Math.ceil(
      Math.min(raster.width, raster.height) /
        Math.min(layout.cell.width, layout.cell.height),
    ),
  );
}
