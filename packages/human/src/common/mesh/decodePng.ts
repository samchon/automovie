import { unzlibSync } from "fflate";

import type { IPngImage } from "./structures/IPngImage";

/** The eight-byte PNG signature (W3C PNG, 2nd edition, section 5.2). */
const SIGNATURE: readonly number[] = [137, 80, 78, 71, 13, 10, 26, 10];
const DATA_URI: string = "data:image/png;base64,";

/**
 * Decode resident basis textures for numerical colour rules and source-colour readers.
 *
 * Iris, fibre and oral readers decode a basis material's resident PNG
 * texture, rewrite the texels their rules own and encode the result as a new
 * data URI; the basis and the input string are never changed. Only the
 * non-interlaced 8-bit forms a basis texture uses are read: greyscale (type
 * 0), RGB (2), grey with alpha (4) and RGBA (6), every filter type of the
 * PNG specification (W3C PNG, 2nd edition, section 9) included. Other bit
 * depths, palettes and interlacing are refused by name rather than decoded
 * approximately, because a wrong decode would silently repaint a whole
 * texture. Basis chunks are assumed structurally valid; CRCs are not checked.
 * Decoding always yields RGBA bytes, alpha 255 where the source has
 * none. `encodePng` writes the result back.
 *
 * @evidence contracts/common.md#principled-implementation Noninterlaced 8-bit grey/RGB/grey-alpha/RGBA basis PNGs use filters 0..4; zlib rows reconstruct owned RGBA. Input chunks are assumed structurally valid and CRCs are not checked.
 * @evidence contracts/common.md#clear-and-simple-design One decoder supplies iris/fibre/oral source-colour readers; fflate owns decompression and this owner reconstructs filters/texels.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported depth/palette/interlace/filter modes refuse instead of approximately repainting; no expected image or anatomical pigment is synthesized.
 * @evidence contracts/common.md#meaningful-documentation The public prose gives supported modes, RGBA/alpha result, immutable source and structural-validity/CRC limits.
 * @evidence contracts/performance.md#efficient-algorithms For encoded B bytes and P pixels, copies/filter/RGBA passes cost O(B+P) plus fflate work; decompressed allocation has no separate global size cap.
 * @evidence contracts/performance.md#reuse-equivalent-work IDAT fragments join once and prior reconstructed bytes supply filter predictors; caller owners decide texture caching rather than decoder URI memoization.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Encoded/raw/channel buffers expire with the invocation while RGBA transfers to the reader, with no I/O handles, persistent image cache or task.
 */
export function decodePng(uri: string): IPngImage {
  if (!uri.startsWith(DATA_URI))
    throw new Error("A texture must be a base64 PNG data URI.");
  const bytes: Uint8Array = base64Bytes(uri.slice(DATA_URI.length));
  if (
    SIGNATURE.some(
      (value: number, index: number): boolean => bytes[index] !== value,
    )
  )
    throw new Error("The texture is not a PNG.");
  const view: DataView = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  );
  let offset: number = 8;
  let header: { width: number; height: number; type: number } | null = null;
  const data: Uint8Array[] = [];
  while (offset + 8 <= bytes.length) {
    const length: number = view.getUint32(offset);
    const name: string = String.fromCharCode(
      ...bytes.subarray(offset + 4, offset + 8),
    );
    const body: Uint8Array = bytes.subarray(offset + 8, offset + 8 + length);
    if (name === "IHDR") {
      const depth: number = body[8];
      const type: number = body[9];
      if (depth !== 8 || ![0, 2, 4, 6].includes(type) || body[12] !== 0)
        throw new Error(
          "Textures must be non-interlaced 8-bit grey, RGB or RGBA PNGs.",
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
    throw new Error("The texture PNG has no image header or data.");
  const channels: number = { 0: 1, 2: 3, 4: 2, 6: 4 }[header.type]!;
  const stride: number = header.width * channels;
  const joined: Uint8Array = new Uint8Array(
    data.reduce(
      (sum: number, part: Uint8Array): number => sum + part.length,
      0,
    ),
  );
  data.reduce(
    (at: number, part: Uint8Array): number => (
      joined.set(part, at),
      at + part.length
    ),
    0,
  );
  const raw: Uint8Array = unzlibSync(joined);
  if (raw.length !== (stride + 1) * header.height)
    throw new Error("The texture PNG data does not match its size.");
  const pixels: Uint8Array = new Uint8Array(stride * header.height);
  for (let y: number = 0; y < header.height; ++y) {
    const filter: number = raw[y * (stride + 1)];
    if (filter > 4) throw new Error("The texture PNG has an unknown filter.");
    for (let x: number = 0; x < stride; ++x) {
      const left: number =
        x >= channels ? pixels[y * stride + x - channels] : 0;
      const up: number = y > 0 ? pixels[(y - 1) * stride + x] : 0;
      const corner: number =
        x >= channels && y > 0 ? pixels[(y - 1) * stride + x - channels] : 0;
      const predictor: number =
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
  const rgba: Uint8Array = new Uint8Array(header.width * header.height * 4);
  for (let i: number = 0; i < header.width * header.height; ++i) {
    const source: Uint8Array = pixels.subarray(
      i * channels,
      i * channels + channels,
    );
    const grey: boolean = channels <= 2;
    rgba[4 * i] = source[0];
    rgba[4 * i + 1] = grey ? source[0] : source[1];
    rgba[4 * i + 2] = grey ? source[0] : source[2];
    rgba[4 * i + 3] =
      channels === 2 ? source[1] : channels === 4 ? source[3] : 255;
  }
  return { width: header.width, height: header.height, rgba };
}

function paeth(left: number, up: number, corner: number): number {
  const estimate: number = left + up - corner;
  const a: number = Math.abs(estimate - left);
  const b: number = Math.abs(estimate - up);
  const c: number = Math.abs(estimate - corner);
  return a <= b && a <= c ? left : b <= c ? up : corner;
}

function base64Bytes(text: string): Uint8Array {
  const binary: string = atob(text);
  const bytes: Uint8Array = new Uint8Array(binary.length);
  for (let i: number = 0; i < binary.length; ++i)
    bytes[i] = binary.charCodeAt(i);
  return bytes;
}
