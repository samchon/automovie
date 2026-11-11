import type { IAutoMovieRasterImage } from "../scene/raster/IAutoMovieRasterImage.js";
import type { IAutoMovieDrawResult } from "./IAutoMovieDrawResult.js";

/**
 * Turn a draw page's picture back into the raster the capture core reads: the base64 RGBA bytes of an `IAutoMovieDrawResult`, rows from the top, at the size it states.
 *
 * It throws when the stated size is not the expected raster, or the bytes are not that size's, naming both.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the input, the output layout and both refusals.
 * @evidence contracts/development/implementation.md#principled-implementation The page already wrote rows from the top, so the bytes are copied in order; `atob` exists in every page and in Node, so the host needs no Node buffer.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Check the size, decode, check the length.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A picture of another size is refused, never resized or padded, so a still always has the raster its cell planned.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the text's length.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure conversion of one picture.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Allocates the decoded string once and one byte array, which the returned raster owns.
 */
export function decodeAutoMovieDrawPixels(
  result: Pick<IAutoMovieDrawResult, "pixels" | "width" | "height">,
  expected: { width: number; height: number },
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
