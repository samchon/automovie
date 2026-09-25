import { unzlibSync } from "fflate";

import type { IPortraitPngImage } from "./structures/IPortraitPngImage";

/**
 * The PNG decoder for facial textures that are recoloured by numerical rules.
 *
 * `createHumanFaceIrisPigment` decodes a basis material's `data:image/png`
 * texture, rewrites the texels its rule owns and encodes the result as a new
 * data URI; the basis and the input string are never changed. Only the
 * non-interlaced 8-bit forms a basis texture uses are read: greyscale (type
 * 0), RGB (2), grey with alpha (4) and RGBA (6), every filter type of the
 * PNG specification (W3C PNG, 2nd edition, section 9) included. Other bit
 * depths, palettes and interlacing are refused by name rather than decoded
 * approximately, because a wrong decode would silently repaint a whole
 * texture. Decoding always yields RGBA bytes, alpha 255 where the source has
 * none. `encodePortraitPng` writes the result back.
 */

/** The eight-byte PNG signature (W3C PNG, 2nd edition, section 5.2). */
const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const DATA_URI = "data:image/png;base64,";

/**
 * Decode a base64 PNG data URI into RGBA bytes.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Reads the shared basis texture the numerical iris rule recolours, so no per-person image is stored.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-iris Decodes the basis eye texture exactly before the iris texels are rewritten and refuses forms it cannot read exactly.
 */
export function decodePortraitPng(uri: string): IPortraitPngImage {
  if (!uri.startsWith(DATA_URI))
    throw new Error("A facial texture must be a base64 PNG data URI.");
  const bytes = base64Bytes(uri.slice(DATA_URI.length));
  if (SIGNATURE.some((value, index) => bytes[index] !== value))
    throw new Error("The facial texture is not a PNG.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8;
  let header: { width: number; height: number; type: number } | null = null;
  const data: Uint8Array[] = [];
  while (offset + 8 <= bytes.length) {
    const length = view.getUint32(offset);
    const name = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    const body = bytes.subarray(offset + 8, offset + 8 + length);
    if (name === "IHDR") {
      const depth = body[8];
      const type = body[9];
      if (depth !== 8 || ![0, 2, 4, 6].includes(type) || body[12] !== 0)
        throw new Error(
          "Facial textures must be non-interlaced 8-bit grey, RGB or RGBA PNGs.",
        );
      header = {
        width: view.getUint32(offset + 8),
        height: view.getUint32(offset + 12),
        type,
      };
    } else if (name === "IDAT") data.push(body);
    else if (name === "IEND") break;
    offset += 12 + length;
  }
  if (header === null || data.length === 0)
    throw new Error("The facial texture PNG has no image header or data.");
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[header.type]!;
  const stride = header.width * channels;
  const joined = new Uint8Array(
    data.reduce((sum, part) => sum + part.length, 0),
  );
  data.reduce((at, part) => (joined.set(part, at), at + part.length), 0);
  const raw = unzlibSync(joined);
  if (raw.length !== (stride + 1) * header.height)
    throw new Error("The facial texture PNG data does not match its size.");
  const pixels = new Uint8Array(stride * header.height);
  for (let y = 0; y < header.height; ++y) {
    const filter = raw[y * (stride + 1)];
    if (filter > 4)
      throw new Error("The facial texture PNG has an unknown filter.");
    for (let x = 0; x < stride; ++x) {
      const left = x >= channels ? pixels[y * stride + x - channels] : 0;
      const up = y > 0 ? pixels[(y - 1) * stride + x] : 0;
      const corner =
        x >= channels && y > 0 ? pixels[(y - 1) * stride + x - channels] : 0;
      const predictor =
        filter === 0
          ? 0
          : filter === 1
            ? left
            : filter === 2
              ? up
              : filter === 3
                ? (left + up) >> 1
                : paeth(left, up, corner);
      pixels[y * stride + x] =
        (raw[y * (stride + 1) + 1 + x] + predictor) & 255;
    }
  }
  const rgba = new Uint8Array(header.width * header.height * 4);
  for (let i = 0; i < header.width * header.height; ++i) {
    const source = pixels.subarray(i * channels, i * channels + channels);
    const grey = channels <= 2;
    rgba[4 * i] = source[0];
    rgba[4 * i + 1] = grey ? source[0] : source[1];
    rgba[4 * i + 2] = grey ? source[0] : source[2];
    rgba[4 * i + 3] =
      channels === 2 ? source[1] : channels === 4 ? source[3] : 255;
  }
  return { width: header.width, height: header.height, rgba };
}

function paeth(left: number, up: number, corner: number): number {
  const estimate = left + up - corner;
  const a = Math.abs(estimate - left);
  const b = Math.abs(estimate - up);
  const c = Math.abs(estimate - corner);
  return a <= b && a <= c ? left : b <= c ? up : corner;
}

function base64Bytes(text: string): Uint8Array {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; ++i) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
