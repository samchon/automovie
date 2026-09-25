import { zlibSync } from "fflate";

import type { IPortraitPngImage } from "./structures/IPortraitPngImage";

/**
 * The PNG encoder for facial textures that are recoloured by numerical rules.
 *
 * `createHumanFaceIrisPigment` encodes its repainted eye texture with this
 * as a new data URI owned by the built material. It always writes 8-bit RGBA
 * with filter 0 and zlib level 6, so decoding the output with
 * `decodePortraitPng` reproduces the input bytes exactly and the same bytes
 * always yield the same string.
 */

/** The eight-byte PNG signature (W3C PNG, 2nd edition, section 5.2). */
const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const DATA_URI = "data:image/png;base64,";

/** Byte-wise CRC-32 table of the reflected polynomial 0xedb88320 (PNG annex D). */
const CRC_TABLE = Array.from({ length: 256 }, (_, byte) => {
  let crc = byte;
  for (let bit = 0; bit < 8; ++bit)
    crc = (crc >>> 1) ^ ((crc & 1) * 0xedb88320);
  return crc >>> 0;
});

/**
 * Encode RGBA bytes as a base64 PNG data URI.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Emits the recoloured eye texture inside the model's own material, keeping replay free of external files.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-iris Writes the recoloured eye texture losslessly as a fresh texture owned by the built material.
 */
export function encodePortraitPng(image: IPortraitPngImage): string {
  const { width, height, rgba } = image;
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
  const stride = 1 + width * 4;
  const raw = new Uint8Array(stride * height);
  for (let y = 0; y < height; ++y)
    raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * stride + 1);
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  header.set([8, 6, 0, 0, 0], 8);
  const parts = [
    new Uint8Array(SIGNATURE),
    chunk("IHDR", header),
    chunk("IDAT", zlibSync(raw, { level: 6 })),
    chunk("IEND", new Uint8Array(0)),
  ];
  const bytes = new Uint8Array(
    parts.reduce((sum, part) => sum + part.length, 0),
  );
  parts.reduce((at, part) => (bytes.set(part, at), at + part.length), 0);
  let text = "";
  for (let i = 0; i < bytes.length; i += 0x8000)
    text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return DATA_URI + btoa(text);
}

function chunk(name: string, data: Uint8Array): Uint8Array {
  const bytes = new Uint8Array(12 + data.length);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; ++i) bytes[4 + i] = name.charCodeAt(i);
  bytes.set(data, 8);
  // CRC-32 (ISO 3309) over the chunk name and data, as PNG section 5.5 states.
  let crc = 0xffffffff;
  for (let i = 4; i < bytes.length - 4; ++i)
    crc = CRC_TABLE[(crc ^ bytes[i]) & 255] ^ (crc >>> 8);
  view.setUint32(bytes.length - 4, (crc ^ 0xffffffff) >>> 0);
  return bytes;
}
