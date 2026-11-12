import type { IAutoMovieRasterImage } from "./IAutoMovieRasterImage.js";
import { crcAutoMoviePngChunk } from "./crcAutoMoviePngChunk.js";

/** The eight bytes every PNG file starts with. */
const SIGNATURE: readonly number[] = [
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
];

/**
 * Encode a picture, such as a drawn still, a contact sheet or a difference image, as a lossless 8-bit RGB PNG.
 *
 * The picture is opaque, so alpha is dropped. Rows use filter type 0 and one zlib stream made by `CompressionStream("deflate")`, which Node 22 and every current browser provide as a global, so this module imports no Node built-in and runs in a page as in a Node host. Encoding is therefore asynchronous. `decodeAutoMovieRasterPng` and every PNG reader decode the result.
 *
 * It rejects a size that is not a positive whole number of pixels and a pixel buffer whose length disagrees with the size.
 *
 * ```ts
 * await storage.writeFile(`${root}/still.png`, await encodeAutoMovieRasterPng(picture));
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the format, the dropped alpha, the row filter, where compression comes from and why the call is asynchronous, who can read the result, and both refusals.
 * @evidence contracts/development/implementation.md#principled-implementation The chunk layout, big-endian lengths and CRC-32 over type and data follow the PNG specification; the Compression Streams standard's `deflate` format is the zlib stream (RFC 1950) an IDAT chunk requires.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Rows are packed once, compressed once and wrapped in the three required chunks.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A buffer that disagrees with the size throws instead of writing a truncated image, and a zero-sized picture, which PNG forbids, is refused.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the pixel count: one packing pass, one compression stream and one copy into the file.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The CRC table is shared with the decoder.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the packed rows and the compressed stream until the file is assembled; the stream ends with the call and nothing is retained.
 */
export async function encodeAutoMovieRasterPng(
  raster: IAutoMovieRasterImage,
): Promise<Uint8Array> {
  const { width, height, pixels } = raster;
  if (
    !(Number.isSafeInteger(width) && width > 0) ||
    !(Number.isSafeInteger(height) && height > 0)
  )
    throw new Error(`A PNG of ${width}x${height} pixels cannot be written`);
  if (pixels.length !== width * height * 4)
    throw new Error("Raster pixels do not match its size");

  // Each row is a filter byte 0 and its RGB triples.
  const stride: number = width * 3 + 1;
  const rows: Uint8Array<ArrayBuffer> = new Uint8Array(stride * height);
  for (let y: number = 0; y < height; y++)
    for (let x: number = 0; x < width; x++) {
      const from: number = (y * width + x) * 4;
      const to: number = y * stride + 1 + x * 3;
      rows[to] = pixels[from]!;
      rows[to + 1] = pixels[from + 1]!;
      rows[to + 2] = pixels[from + 2]!;
    }
  const compressed: Uint8Array = new Uint8Array(
    await new Response(
      new Blob([rows]).stream().pipeThrough(new CompressionStream("deflate")),
    ).arrayBuffer(),
  );

  // IHDR: size, bit depth 8, colour type 2 (RGB), deflate, filter method 0, no interlace.
  const header: Uint8Array = new Uint8Array(13);
  const view: DataView = new DataView(header.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  header.set([8, 2, 0, 0, 0], 8);
  const parts: Uint8Array[] = [
    Uint8Array.from(SIGNATURE),
    chunk("IHDR", header),
    chunk("IDAT", compressed),
    chunk("IEND", new Uint8Array(0)),
  ];
  const file: Uint8Array = new Uint8Array(
    parts.reduce(
      (sum: number, part: Uint8Array): number => sum + part.length,
      0,
    ),
  );
  let offset: number = 0;
  for (const part of parts) {
    file.set(part, offset);
    offset += part.length;
  }
  return file;
}

/** One PNG chunk: length, type, data and CRC-32 of type and data. */
function chunk(type: string, data: Uint8Array): Uint8Array {
  const out: Uint8Array = new Uint8Array(12 + data.length);
  const view: DataView = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let index: number = 0; index < 4; index++)
    out[4 + index] = type.charCodeAt(index);
  out.set(data, 8);
  view.setUint32(
    8 + data.length,
    crcAutoMoviePngChunk(out.subarray(4, 8 + data.length)),
  );
  return out;
}
