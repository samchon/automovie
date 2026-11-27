import type {
  IAutoMovieCaptureLayout,
  IAutoMovieRasterImage,
} from "@automovie/interface";

/*
 * The font pixel size, in still pixels, at which a capture stamps labels on a
 * still: large enough that one font pixel stays at least one sheet pixel once
 * the still is reduced into its cell, and never below one.
 *
 * A still of `width` by `height` is reduced into a cell of the layout, so the
 * reduction is the ratio of their shorter sides, and a font pixel of that many
 * still pixels survives it. The capture run stamps at this scale, and a draw
 * page places its labels at the same scale so labels it keeps apart stay apart
 * once stamped.
 */
export function scaleAutoMovieCaptureLabels(
  raster: Pick<IAutoMovieRasterImage, "width" | "height">,
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
