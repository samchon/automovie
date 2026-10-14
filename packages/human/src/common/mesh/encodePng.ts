import { zlibSync } from "fflate";

import type { IPngImage } from "./structures/IPngImage";

/** The eight-byte PNG signature (W3C PNG, 2nd edition, section 5.2). */
const SIGNATURE: readonly number[] = [137, 80, 78, 71, 13, 10, 26, 10];
const DATA_URI: string = "data:image/png;base64,";

/** Byte-wise CRC-32 table of the reflected polynomial 0xedb88320 (PNG annex D). */
const CRC_TABLE: readonly number[] = Array.from({ length: 256 }, (_value: unknown, byte: number): number => {
  let crc: number = byte;
  for (let bit: number = 0; bit < 8; ++bit)
    crc = (crc >>> 1) ^ ((crc & 1) * 0xedb88320);
  return crc >>> 0;
});

/**
 * The PNG encoder for textures that are recoloured by numerical rules.
 *
 * Numerical skin/detail/occlusion and iris/fibre colouring use this encoder
 * for a new data URI owned by the built material. It always writes 8-bit RGBA
 * with filter 0 and zlib level 6, so decoding the output with
 * `decodePng` reproduces the input bytes exactly and the same bytes
 * always yield the same string.
 *
 * @evidence contracts/common.md#principled-implementation Positive integer dimensions and exact RGBA byte length encode 8-bit noninterlaced PNG with filter zero, zlib level six and CRC32 chunks; this transport does no colour-space conversion.
 * @evidence contracts/common.md#clear-and-simple-design One encoder serves numerical skin/detail/occlusion and repainted iris/fibre textures; pigment rules remain with callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fixed filter/compression defines reproducible transport without source repainting, specimen cases or expected-image substitution.
 * @evidence contracts/common.md#meaningful-documentation The prose gives new URI ownership, RGBA mode, compression/filter policy and pixel round-trip intent; the guard states dimension/length refusal.
 * @evidence contracts/performance.md#efficient-algorithms For P pixels and B output bytes, row/chunk/CRC/base64 work is O(P+B) plus compression cost; 32768-byte text segments bound variadic conversion.
 * @evidence contracts/performance.md#reuse-equivalent-work One invariant 256-entry CRC table is shared by polynomial identity, while mutable image byte arrays have no result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Raw rows/chunks/joined bytes/strings are local and the URI transfers to its caller; the fixed table retains no native resource or running task.
 */
export function encodePng(image: IPngImage): string {
  const { width, height, rgba }: IPngImage = image;
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width <= 0 ||
    height <= 0 ||
    rgba.length !== width * height * 4
  )
    throw new Error(
      "A PNG needs a positive integer size and four bytes per pixel.",
    );
  const stride: number = 1 + width * 4;
  const raw: Uint8Array = new Uint8Array(stride * height);
  for (let y: number = 0; y < height; ++y)
    raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * stride + 1);
  const header: Uint8Array = new Uint8Array(13);
  const view: DataView = new DataView(header.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  header.set([8, 6, 0, 0, 0], 8);
  const parts: Uint8Array[] = [
    new Uint8Array(SIGNATURE),
    chunk("IHDR", header),
    chunk("IDAT", zlibSync(raw, { level: 6 })),
    chunk("IEND", new Uint8Array(0)),
  ];
  const bytes: Uint8Array = new Uint8Array(
    parts.reduce((sum: number, part: Uint8Array): number => sum + part.length, 0),
  );
  parts.reduce((at: number, part: Uint8Array): number => (bytes.set(part, at), at + part.length), 0);
  let text: string = "";
  for (let i: number = 0; i < bytes.length; i += 0x8000)
    text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return DATA_URI + btoa(text);
}

function chunk(name: string, data: Uint8Array): Uint8Array {
  const bytes: Uint8Array = new Uint8Array(12 + data.length);
  const view: DataView = new DataView(bytes.buffer);
  view.setUint32(0, data.length);
  for (let i: number = 0; i < 4; ++i) bytes[4 + i] = name.charCodeAt(i);
  bytes.set(data, 8);
  // CRC-32 (ISO 3309) over the chunk name and data, as PNG section 5.5 states.
  let crc: number = 0xffffffff;
  for (let i: number = 4; i < bytes.length - 4; ++i)
    crc = CRC_TABLE[(crc ^ bytes[i]) & 255] ^ (crc >>> 8);
  view.setUint32(bytes.length - 4, (crc ^ 0xffffffff) >>> 0);
  return bytes;
}
