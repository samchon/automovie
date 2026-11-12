import type { IAutoMovieRasterImage } from "./IAutoMovieRasterImage.js";
import { crcAutoMoviePngChunk } from "./crcAutoMoviePngChunk.js";

/** The eight bytes every PNG file starts with. */
const SIGNATURE: readonly number[] = [
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
];

/** Samples per pixel of each PNG colour type, with the bit depths the specification allows for it. */
const COLOUR_TYPES: Readonly<
  Record<number, { channels: number; depths: readonly number[] }>
> = {
  0: { channels: 1, depths: [1, 2, 4, 8, 16] },
  2: { channels: 3, depths: [8, 16] },
  3: { channels: 1, depths: [1, 2, 4, 8] },
  4: { channels: 2, depths: [8, 16] },
  6: { channels: 4, depths: [8, 16] },
};

/**
 * Decode a PNG file into the picture record the sheet, the comparison and the content hash take: 8-bit RGBA rows from the top.
 *
 * It reads every non-interlaced PNG the specification allows: grey, RGB, palette, grey with alpha and RGBA, at every bit depth of each, so a still this package encoded and a still FFmpeg wrote read alike. A sample of 16 bits keeps its high byte and a sample under 8 bits is scaled to the full byte. Alpha comes from an alpha channel when the file has one and is 255 otherwise; transparency chunks are ignored, because the picture record is opaque and no consumer reads alpha. The zlib stream is inflated by `DecompressionStream("deflate")`, a global of Node 22 and every current browser, so the call is asynchronous and imports no Node built-in.
 *
 * It rejects a file that is not a PNG, a chunk whose CRC disagrees, a missing header, palette or image data, an interlaced file, an unknown colour type, bit depth, compression, filter method or row filter, and image data that does not inflate to the size the header states, each with the reason; the caller adds the file's name.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the output layout, the colour types and depths read, how samples become bytes, what alpha holds and why transparency is ignored, where inflation comes from, and every refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Chunk walking, CRC checking, the five row filters with the Paeth predictor and sample unpacking follow the PNG specification (sections 5, 7, 9 and 11); the Compression Streams `deflate` format is the zlib stream an IDAT sequence holds.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Walk the chunks, inflate the joined image data, undo each row's filter, then expand each pixel to RGBA.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Interlaced files are refused rather than read as if they were not; a corrupt or truncated file throws instead of yielding a partial picture.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the file and the pixel count: one CRC pass per chunk, one inflation, one unfiltering pass and one expansion pass, reusing the previous row in place.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The CRC table is shared with the encoder.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the joined image data, the inflated rows and the returned pixels until the call ends; only the returned picture outlives it.
 */
export async function decodeAutoMovieRasterPng(
  bytes: Uint8Array,
): Promise<IAutoMovieRasterImage> {
  if (
    bytes.length < 8 ||
    !SIGNATURE.every(
      (byte: number, index: number): boolean => bytes[index] === byte,
    )
  )
    throw new Error("The bytes are not a PNG file");

  // Walk the chunks, checking each CRC.
  const view: DataView = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  );
  let header: Uint8Array | null = null;
  let palette: Uint8Array | null = null;
  const data: Uint8Array[] = [];
  let ended: boolean = false;
  for (let at: number = 8; at < bytes.length && !ended; ) {
    if (at + 12 > bytes.length) throw new Error("A PNG chunk is truncated");
    const length: number = view.getUint32(at);
    if (at + 12 + length > bytes.length)
      throw new Error("A PNG chunk is truncated");
    const type: string = String.fromCharCode(...bytes.subarray(at + 4, at + 8));
    const body: Uint8Array = bytes.subarray(at + 8, at + 8 + length);
    if (
      crcAutoMoviePngChunk(bytes.subarray(at + 4, at + 8 + length)) !==
      view.getUint32(at + 8 + length)
    )
      throw new Error(`The PNG chunk ${type} fails its CRC`);
    if (type === "IHDR") header = body;
    else if (type === "PLTE") palette = body;
    else if (type === "IDAT") data.push(body);
    else if (type === "IEND") ended = true;
    at += 12 + length;
  }
  if (header === null || header.length !== 13)
    throw new Error("The PNG has no valid IHDR chunk");
  if (data.length === 0) throw new Error("The PNG has no image data");

  // Header fields.
  const fields: DataView = new DataView(
    header.buffer,
    header.byteOffset,
    header.byteLength,
  );
  const width: number = fields.getUint32(0);
  const height: number = fields.getUint32(4);
  const depth: number = header[8]!;
  const colour: number = header[9]!;
  const form: { channels: number; depths: readonly number[] } | undefined =
    COLOUR_TYPES[colour];
  if (width === 0 || height === 0)
    throw new Error(`The PNG's size ${width}x${height} is empty`);
  if (form === undefined)
    throw new Error(`PNG colour type ${colour} is unknown`);
  if (!form.depths.includes(depth))
    throw new Error(`PNG colour type ${colour} has no bit depth ${depth}`);
  if (header[10] !== 0 || header[11] !== 0)
    throw new Error("The PNG's compression or filter method is unknown");
  if (header[12] !== 0) throw new Error("Interlaced PNG files are not read");
  if (colour === 3 && (palette === null || palette.length % 3 !== 0))
    throw new Error("The palette PNG has no valid PLTE chunk");

  // Inflate the joined image data.
  const joined: Uint8Array<ArrayBuffer> = new Uint8Array(
    data.reduce(
      (sum: number, part: Uint8Array): number => sum + part.length,
      0,
    ),
  );
  let offset: number = 0;
  for (const part of data) {
    joined.set(part, offset);
    offset += part.length;
  }
  let rows: Uint8Array;
  try {
    rows = new Uint8Array(
      await new Response(
        new Blob([joined])
          .stream()
          .pipeThrough(new DecompressionStream("deflate")),
      ).arrayBuffer(),
    );
  } catch (error) {
    throw new Error(
      `The PNG's image data does not inflate: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
  const stride: number = Math.ceil((width * form.channels * depth) / 8);
  if (rows.length !== (stride + 1) * height)
    throw new Error(
      `The PNG's image data holds ${rows.length} bytes where its header asks for ${(stride + 1) * height}`,
    );

  // Undo each row's filter in place; `step` is the bytes of one whole pixel, at least one.
  const step: number = Math.max(1, (form.channels * depth) / 8);
  for (let y: number = 0; y < height; y++) {
    const start: number = y * (stride + 1) + 1;
    const filter: number = rows[start - 1]!;
    const above: number = start - (stride + 1);
    for (let x: number = 0; x < stride; x++) {
      const left: number = x >= step ? rows[start + x - step]! : 0;
      const up: number = y > 0 ? rows[above + x]! : 0;
      const corner: number = y > 0 && x >= step ? rows[above + x - step]! : 0;
      let predicted: number;
      if (filter === 0) predicted = 0;
      else if (filter === 1) predicted = left;
      else if (filter === 2) predicted = up;
      else if (filter === 3) predicted = Math.floor((left + up) / 2);
      else if (filter === 4) predicted = paeth(left, up, corner);
      else throw new Error(`PNG row ${y} has an unknown filter ${filter}`);
      rows[start + x] = (rows[start + x]! + predicted) & 0xff;
    }
  }

  // Expand every pixel to 8-bit RGBA.
  const colours: Uint8Array = palette ?? new Uint8Array(0);
  const pixels: Uint8ClampedArray = new Uint8ClampedArray(width * height * 4);
  const top: number = (1 << Math.min(depth, 8)) - 1;
  for (let y: number = 0; y < height; y++) {
    const start: number = y * (stride + 1) + 1;
    const sample: (index: number) => number = (index: number): number => {
      if (depth === 16) return rows[start + index * 2]!;
      if (depth === 8) return rows[start + index]!;
      const bit: number = index * depth;
      return (rows[start + (bit >> 3)]! >> (8 - depth - (bit & 7))) & top;
    };
    for (let x: number = 0; x < width; x++) {
      const target: number = (y * width + x) * 4;
      const first: number = x * form.channels;
      if (colour === 3) {
        const entry: number = sample(first) * 3;
        if (entry + 3 > colours.length)
          throw new Error(`PNG palette index ${entry / 3} is out of range`);
        pixels.set(
          [colours[entry]!, colours[entry + 1]!, colours[entry + 2]!, 255],
          target,
        );
        continue;
      }
      const scale: (value: number) => number = (value: number): number =>
        depth < 8 ? Math.round((value * 255) / top) : value;
      if (form.channels <= 2) {
        const grey: number = scale(sample(first));
        pixels.set(
          [grey, grey, grey, form.channels === 2 ? sample(first + 1) : 255],
          target,
        );
      } else
        pixels.set(
          [
            sample(first),
            sample(first + 1),
            sample(first + 2),
            form.channels === 4 ? sample(first + 3) : 255,
          ],
          target,
        );
    }
  }
  return { width, height, pixels };
}

/** The Paeth predictor of the PNG specification, section 9.4: the neighbour nearest to left + up - corner. */
function paeth(left: number, up: number, corner: number): number {
  const estimate: number = left + up - corner;
  const toLeft: number = Math.abs(estimate - left);
  const toUp: number = Math.abs(estimate - up);
  const toCorner: number = Math.abs(estimate - corner);
  if (toLeft <= toUp && toLeft <= toCorner) return left;
  if (toUp <= toCorner) return up;
  return corner;
}
