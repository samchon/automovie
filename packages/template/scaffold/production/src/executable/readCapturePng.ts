import type { IAutoMovieRasterImage } from "@automovie/viewer";
import { readFile } from "node:fs/promises";
import { PNG } from "pngjs";

/**
 * Decode a PNG file into the picture record the viewer's sheet and comparison take: 8-bit RGBA rows from the top.
 *
 * It throws naming the file when the file is missing or is not a PNG, so a run that reads many stills says which one stopped it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the input, the consumers, the pixel layout and the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation The installed decoder converts every PNG colour type and bit depth to 8-bit RGBA, the layout of the picture record, so a still from the rasterizer and one from FFmpeg read alike.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read, decode, wrap.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing or malformed file throws with its path and the reader's or the decoder's reason; no blank picture stands in.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the file, and the decoded bytes are viewed in place instead of copied.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each file is decoded once by its caller.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The file is read whole and closed before decoding; only the returned picture outlives the call.
 */
export async function readCapturePng(
  file: string,
): Promise<IAutoMovieRasterImage> {
  let png: PNG;
  try {
    png = PNG.sync.read(await readFile(file));
  } catch (error) {
    throw new Error(
      `${file} cannot be read as a PNG: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
  return {
    width: png.width,
    height: png.height,
    pixels: new Uint8ClampedArray(
      png.data.buffer,
      png.data.byteOffset,
      png.data.byteLength,
    ),
  };
}
