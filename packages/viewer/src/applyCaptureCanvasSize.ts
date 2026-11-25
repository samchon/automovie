/**
 * Set a capture canvas's CSS width and height to the supplied finite positive
 * dimensions. Invalid dimensions leave both current styles unchanged, allowing
 * an untouched interactive canvas to keep its responsive CSS. This adapter does
 * not set the backing raster, device pixel ratio, screenshot bounds or encoded
 * video size; the rendering and capture hosts own their agreement with these
 * CSS dimensions.
 */
export const applyCaptureCanvasSize: (
  canvas: { style: Pick<HTMLCanvasElement["style"], "width" | "height"> },
  width: number,
  height: number,
) => void = (
  canvas: { style: Pick<HTMLCanvasElement["style"], "width" | "height"> },
  width: number,
  height: number,
): void => {
  if (width <= 0 || height <= 0) return;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
};
