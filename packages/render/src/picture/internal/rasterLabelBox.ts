import type { IAutoMovieRasterImage, IAutoMovieRasterPoint } from "@automovie/interface";

/* The paint box shared by label admission and raster stamping. */
export function rasterLabelBox(
  raster: Pick<IAutoMovieRasterImage, "width" | "height">,
  text: string,
  scale: number,
  at: IAutoMovieRasterPoint,
): { left: number; top: number; width: number; height: number } {
  if (!Number.isSafeInteger(scale) || scale <= 0)
    throw new Error("Label scale must be a positive safe integer");
  const width: number = Math.min(raster.width, scale * (4 * [...text.toLowerCase()].length + 3));
  const height: number = Math.min(raster.height, 9 * scale);
  return {
    left: Math.max(0, Math.min(Math.round(at.x), raster.width - width)),
    top: Math.max(0, Math.min(Math.round(at.y), raster.height - height)),
    width,
    height,
  };
}
