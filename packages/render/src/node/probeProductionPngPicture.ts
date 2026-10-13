import type {
  AutoMovieProductionPngColor,
  IAutoMovieProductionPngPicture,
} from "@automovie/interface";

import { residentPngJs } from "./residentPngJs";

/**
 * Decode one PNG datastream and report its IHDR, colour, alpha, colour-space,
 * pixel-aspect and orientation facts.
 *
 * The datastream must start with the PNG signature, consist of whole chunks
 * with four-letter ASCII types, and end exactly at one IEND chunk; `pngjs`
 * must then decode it, which proves the IHDR, CRCs and image data. The
 * colour space is `srgb` for an `sRGB` chunk, `icc` for an `iCCP` chunk,
 * `srgb` for a `gAMA` of 45455 whose `cHRM`, if present, carries the sRGB
 * chromaticities, `gamma` for any other `gAMA`, and `unidentified` otherwise.
 * The `cICP` and `mDCV` chunks of the third PNG edition are not read. An
 * `eXIf` chunk reports `metadata-present` orientation without being parsed.
 *
 * Each refusal is an `Error` naming the defect: a missing signature, a
 * truncated chunk header or payload, a non-letter chunk type, a missing or
 * non-terminal IEND, the decoder's own refusal, a repeated `sRGB`, `gAMA`,
 * `cHRM`, `iCCP`, `pHYs` or `eXIf` chunk, a malformed `sRGB`, `gAMA`, `cHRM`,
 * `iCCP` or `pHYs` payload, an `sRGB` with a `gAMA` other than 45455, and an
 * `sRGB` together with an `iCCP`.
 *
 * @evidence contracts/common.md#principled-implementation The chunk walk follows the PNG framing of a 4-byte length, 4-byte type, payload and CRC, so every framing refusal is named before the decoder can answer a foreign stream with its own unnamed error; the decoder then owns the IHDR, CRC and zlib checks, and the colour rules follow the PNG specification, where 45455 is the `gAMA` an sRGB encoder writes and `cHRM` would otherwise name different primaries.
 * @evidence contracts/common.md#clear-and-simple-design The function reports observed facts and leaves acceptance to `assertProductionPngPicture`, while chunk framing, the colour-space rule, the pixel aspect and the ICC profile name are small private steps of this one reading.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No file, size or chunk order is special-cased; a contradictory or repeated colour declaration is refused rather than resolved by precedence, and the unread third-edition chunks are the stated limitation.
 * @evidence contracts/common.md#meaningful-documentation The doc states the framing and decoding conditions, how each colour-space value is chosen, which chunks are not read, what orientation means, and every refusal.
 * @evidence contracts/performance.md#efficient-algorithms For C chunks and P pixels the chunk walk is O(C) over views of the input, each unique-chunk lookup is O(C), and the decode is O(P) with an RGBA buffer of 4P bytes, which is the cost of proving the image data decodes.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call probes the bytes it was handed and caches nothing; a picture is probed once per deliverable.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The decoded pixels and the chunk list are released on return, and the returned record holds only numbers and strings; no handle or task is opened.
 */
export const probeProductionPngPicture = (
  bytes: Uint8Array,
): IAutoMovieProductionPngPicture => {
  const chunks: IPngChunk[] = parsePngChunks(bytes);
  residentPngJs().PNG.sync.read(
    Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength),
  );
  // The decoder refused a datastream whose first chunk is not the 13-byte
  // IHDR, an interlace method other than none or Adam7, and a colour type
  // outside the five the format defines, so these reads are in range.
  const header: Uint8Array = chunks[0]!.data;
  const colorType: number = header[9]!;
  const srgb: IPngChunk | undefined = uniquePngChunk(chunks, "sRGB");
  const gamma: IPngChunk | undefined = uniquePngChunk(chunks, "gAMA");
  const chromaticity: IPngChunk | undefined = uniquePngChunk(chunks, "cHRM");
  const icc: IPngChunk | undefined = uniquePngChunk(chunks, "iCCP");
  const physical: IPngChunk | undefined = uniquePngChunk(chunks, "pHYs");
  const exif: IPngChunk | undefined = uniquePngChunk(chunks, "eXIf");
  if (srgb !== undefined && srgb.data.length !== 1)
    throw new Error("PNG sRGB chunk must contain one rendering-intent byte.");
  if (srgb !== undefined && srgb.data[0]! > 3)
    throw new Error(
      "PNG sRGB rendering intent must be between zero and three.",
    );
  if (gamma !== undefined && gamma.data.length !== 4)
    throw new Error("PNG gAMA chunk must contain one unsigned gamma integer.");
  if (chromaticity !== undefined && chromaticity.data.length !== 32)
    throw new Error("PNG cHRM chunk must contain eight chromaticity integers.");
  const gammaValue: number | null =
    gamma === undefined ? null : readUint32(gamma.data, 0);
  if (srgb !== undefined && gammaValue !== null && gammaValue !== SRGB_GAMMA)
    throw new Error(
      `PNG sRGB and gAMA chunks conflict: sRGB requires gAMA ${SRGB_GAMMA}, not ${gammaValue}.`,
    );
  if (srgb !== undefined && icc !== undefined)
    throw new Error(
      "PNG sRGB and iCCP color declarations are mutually exclusive.",
    );
  if (icc !== undefined) assertPngProfileName(icc.data);
  return {
    width: readUint32(header, 0),
    height: readUint32(header, 4),
    bitDepth: header[8]!,
    color: PNG_COLOR_MODELS[colorType]!,
    alpha: colorType === 4 || colorType === 6 ? "straight" : "none",
    interlace: header[12] === 0 ? "none" : "adam7",
    colorSpace:
      srgb !== undefined
        ? "srgb"
        : icc !== undefined
          ? "icc"
          : gammaValue === null
            ? "unidentified"
            : gammaValue === SRGB_GAMMA &&
                (chromaticity === undefined ||
                  SRGB_CHROMATICITIES.every(
                    (value: number, index: number): boolean =>
                      readUint32(chromaticity.data, index * 4) === value,
                  ))
              ? "srgb"
              : "gamma",
    pixelAspect: pngPixelAspect(physical?.data),
    orientation: exif === undefined ? "upright" : "metadata-present",
  };
};

interface IPngChunk {
  type: string;
  data: Uint8Array;
}

/** The `gAMA` value, gamma times 100000, that the PNG specification pairs with sRGB. */
const SRGB_GAMMA: number = 45_455;

/** The `cHRM` white point and red, green and blue primaries of sRGB, times 100000. */
const SRGB_CHROMATICITIES: readonly number[] = [
  31_270, 32_900, 64_000, 33_000, 30_000, 60_000, 15_000, 6_000,
];

/** The five IHDR color types the format defines; the decoder admits no other. */
const PNG_COLOR_MODELS: Readonly<Record<number, AutoMovieProductionPngColor>> =
  {
    0: "gray",
    2: "rgb",
    3: "palette",
    4: "gray-alpha",
    6: "rgba",
  };

/** Split a PNG datastream into chunks whose payloads view `bytes`, refusing every framing defect by name. */
const parsePngChunks = (bytes: Uint8Array): IPngChunk[] => {
  const signature: readonly number[] = [
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ];
  if (
    bytes.length < signature.length ||
    signature.some(
      (value: number, index: number): boolean => bytes[index] !== value,
    )
  )
    throw new Error("PNG datastream lacks the required signature.");
  const chunks: IPngChunk[] = [];
  let cursor: number = 8;
  while (cursor < bytes.length) {
    if (cursor + 12 > bytes.length)
      throw new Error("PNG datastream ends inside a chunk header.");
    const length: number = readUint32(bytes, cursor);
    const end: number = cursor + 12 + length;
    if (end > bytes.length)
      throw new Error("PNG datastream ends inside a declared chunk payload.");
    const type: string = String.fromCharCode(
      ...bytes.subarray(cursor + 4, cursor + 8),
    );
    if (/^[A-Za-z]{4}$/.test(type) === false)
      throw new Error(`PNG chunk type "${type}" is not four ASCII letters.`);
    chunks.push({
      type,
      data: bytes.subarray(cursor + 8, cursor + 8 + length),
    });
    cursor = end;
    if (type === "IEND") break;
  }
  if (chunks.at(-1)?.type !== "IEND" || cursor !== bytes.length)
    throw new Error("PNG datastream does not end at one terminal IEND chunk.");
  return chunks;
};

/** The one chunk of `type`, or undefined; a repeated chunk is refused. */
const uniquePngChunk = (
  chunks: readonly IPngChunk[],
  type: string,
): IPngChunk | undefined => {
  const selected: IPngChunk[] = chunks.filter(
    (chunk: IPngChunk): boolean => chunk.type === type,
  );
  if (selected.length > 1)
    throw new Error(
      `PNG datastream contains ${selected.length} ${type} chunks.`,
    );
  return selected[0];
};

/** The `pHYs` pixel aspect, or square when the chunk is absent. */
const pngPixelAspect = (
  data: Uint8Array | undefined,
): IAutoMovieProductionPngPicture["pixelAspect"] => {
  if (data === undefined) return { kind: "square" };
  if (data.length !== 9)
    throw new Error("PNG pHYs chunk must contain nine bytes.");
  const x: number = readUint32(data, 0);
  const y: number = readUint32(data, 4);
  if (x === 0 || y === 0)
    throw new Error("PNG pHYs density terms must both be positive.");
  const unit: number = data[8]!;
  if (unit !== 0 && unit !== 1)
    throw new Error("PNG pHYs unit specifier must be zero or one.");
  return { kind: "explicit", x, y, unit };
};

/** Refuse an `iCCP` payload without a 1-79 byte profile name and compression method 0. */
const assertPngProfileName = (data: Uint8Array): void => {
  const separator: number = data.indexOf(0);
  if (
    separator <= 0 ||
    separator > 79 ||
    separator + 2 > data.length ||
    data[separator + 1] !== 0
  )
    throw new Error(
      "PNG iCCP chunk has an invalid profile name or compression method.",
    );
};

/** The big-endian unsigned 32-bit integer at `offset` of `bytes`. */
const readUint32 = (bytes: Uint8Array, offset: number): number =>
  new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(
    offset,
    false,
  );
