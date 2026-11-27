import type {
  IAutoMovieDrawResult,
  IAutoMovieRasterImage,
} from "@automovie/interface";

/*
 * Turn a draw page's picture back into the raster the capture core reads: the
 * base64 RGBA bytes of an `IAutoMovieDrawResult`, rows from the top, at the
 * size it states.
 *
 * It throws when the stated size is not the expected raster, or the bytes are
 * not that size's, naming both.
 */
export function decodeDrawPixels(
  result: Pick<IAutoMovieDrawResult, "pixels" | "width" | "height">,
  expected: Pick<IAutoMovieRasterImage, "width" | "height">,
): IAutoMovieRasterImage {
  if (result.width !== expected.width || result.height !== expected.height)
    throw new Error(
      `The page drew ${result.width}x${result.height} pixels where ${expected.width}x${expected.height} were asked`,
    );
  const text: string = atob(result.pixels);
  if (text.length !== result.width * result.height * 4)
    throw new Error(
      `The page returned ${text.length} bytes for a ${result.width}x${result.height} RGBA picture of ${result.width * result.height * 4}`,
    );
  const pixels: Uint8ClampedArray = new Uint8ClampedArray(text.length);
  for (let index: number = 0; index < text.length; index++)
    pixels[index] = text.charCodeAt(index);
  return { width: result.width, height: result.height, pixels };
}
