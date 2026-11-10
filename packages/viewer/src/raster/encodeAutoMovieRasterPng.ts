// A namespace import reads `deflateSync` only when encoding, so a browser
// bundle that reaches this module through a package index still loads.
import * as zlib from "node:zlib";

import type { IAutoMovieSceneRaster } from "./IAutoMovieSceneRaster.js";

/**
 * Encode a Node-drawn frame as a lossless 8-bit RGB PNG.
 *
 * The frame is opaque, so alpha is dropped; rows use filter type 0 and one
 * zlib stream, which every PNG reader, including `pngjs` and the frame-sheet
 * writer, decodes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the format, the dropped alpha, the row filter and who can read the result.
 * @evidence contracts/development/implementation.md#principled-implementation The chunk layout, big-endian lengths and CRC-32 over type and data follow the PNG specification; Node's zlib supplies the deflate stream the IDAT chunk requires.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Rows are packed once, compressed once and wrapped in the three required chunks.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A pixel buffer whose length disagrees with the size throws instead of writing a truncated image.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the pixel count; the CRC table is built once per process.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The CRC table is shared by every chunk and call.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Allocates the packed rows and the returned buffer; nothing is retained.
 */
export function encodeAutoMovieRasterPng(
  raster: IAutoMovieSceneRaster,
): Buffer {
  const { width, height, pixels } = raster;
  if (pixels.length !== width * height * 4)
    throw new Error("Raster pixels do not match its size");
  const stride: number = width * 3 + 1;
  const rows: Buffer = Buffer.alloc(stride * height);
  for (let y: number = 0; y < height; y++)
    for (let x: number = 0; x < width; x++) {
      const from: number = (y * width + x) * 4;
      const to: number = y * stride + 1 + x * 3;
      rows[to] = pixels[from]!;
      rows[to + 1] = pixels[from + 1]!;
      rows[to + 2] = pixels[from + 2]!;
    }
  const header: Buffer = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", zlib.deflateSync(rows, { level: 6 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** One PNG chunk: length, type, data and CRC-32 of type and data. */
function chunk(type: string, data: Buffer): Buffer {
  const out: Buffer = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

/** The CRC-32 lookup table, built on first use. */
let table: Uint32Array | undefined;

/** CRC-32 (IEEE) of a byte range. */
function crc32(bytes: Uint8Array): number {
  if (table === undefined) {
    table = new Uint32Array(256);
    for (let n: number = 0; n < 256; n++) {
      let c: number = n;
      for (let k: number = 0; k < 8; k++)
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
  }
  let crc: number = 0xffffffff;
  for (const byte of bytes) crc = table[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
