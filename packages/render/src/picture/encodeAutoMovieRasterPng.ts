import type { IAutoMovieRasterImage } from "@automovie/interface";

import { crcAutoMoviePngChunk } from "./crcAutoMoviePngChunk.js";

/** The eight bytes every PNG file starts with. */
const SIGNATURE: readonly number[] = [
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
];

/**
 * Encode a picture, such as a drawn still, a contact sheet or a difference
 * image, as a lossless 8-bit RGB PNG, or with `alpha` as an 8-bit RGBA PNG.
 *
 * By default the picture is opaque, so alpha is dropped. With `alpha` the
 * raster's straight alpha is kept as the fourth channel, the PNG colour type 6
 * whose colour is not premultiplied (PNG specification, section 3.3), so a
 * transparent render's frame files carry its coverage. Rows use filter type 0
 * and one zlib stream made by `CompressionStream("deflate")`, which Node 22 and
 * every current browser provide as a global, so this module imports no Node
 * built-in and runs in a page as in a Node host. Encoding is therefore
 * asynchronous. `AutoMovieRenderPicture.decodeRasterPng` and every PNG reader
 * decode the result.
 *
 * It rejects a size that is not a positive whole number of pixels and a pixel
 * buffer whose length disagrees with the size.
 *
 * ```ts
 * await storage.writeFile(
 *   `${root}/still.png`,
 *   await AutoMovieRenderPicture.encodeRasterPng(picture),
 * );
 * ```
 */
export async function encodeAutoMovieRasterPng(
  raster: IAutoMovieRasterImage,
  options?: {
    /**
     * Keep the raster's straight alpha as an RGBA PNG; absent or false writes
     * RGB.
     */
    alpha?: boolean;
  },
): Promise<Uint8Array> {
  const { width, height, pixels } = raster;
  if (!(width > 0) || !(height > 0))
    throw new Error(`A PNG of ${width}x${height} pixels cannot be written`);
  if (pixels.length !== width * height * 4)
    throw new Error("Raster pixels do not match its size");

  // Each row is a filter byte 0 and its RGB triples, or RGBA quadruples.
  const channels: number = options?.alpha === true ? 4 : 3;
  const stride: number = width * channels + 1;
  const rows: Uint8Array<ArrayBuffer> = new Uint8Array(stride * height);
  for (let y: number = 0; y < height; y++)
    for (let x: number = 0; x < width; x++) {
      const from: number = (y * width + x) * 4;
      const to: number = y * stride + 1 + x * channels;
      rows[to] = pixels[from]!;
      rows[to + 1] = pixels[from + 1]!;
      rows[to + 2] = pixels[from + 2]!;
      if (channels === 4) rows[to + 3] = pixels[from + 3]!;
    }
  const compressed: Uint8Array = new Uint8Array(
    await new Response(
      new Blob([rows]).stream().pipeThrough(new CompressionStream("deflate")),
    ).arrayBuffer(),
  );

  // IHDR: size, bit depth 8, colour type 2 (RGB) or 6 (RGBA), deflate, filter method 0, no interlace.
  const header: Uint8Array = new Uint8Array(13);
  const view: DataView = new DataView(header.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  header.set([8, channels === 4 ? 6 : 2, 0, 0, 0], 8);
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
