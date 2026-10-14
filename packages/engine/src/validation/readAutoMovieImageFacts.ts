import { IAutoMovieTextureImageFacts } from "./IAutoMovieTextureImageFacts";

/**
 * Probe PNG, JPEG, WebP and Radiance dimension headers in order, returning media/edge facts or null.
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation Probe PNG, JPEG, WebP and Radiance dimension headers in order, returning media/edge facts or null.
 * @evidence contracts/common.md#clear-and-simple-design Small header readers avoid full pixel decoding for texture-ledger metadata.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A recognized header does not certify checksums, complete payloads or decodability; malformed bytes outside the inspected prefix can remain undetected.
 * @evidence contracts/common.md#meaningful-documentation Nullable input and null refusal are explicit, and positive dimensions are admitted by validateTextureAssets.
 * @evidence contracts/performance.md#efficient-algorithms JPEG marker scanning and bounded HDR text dominate; PNG/WebP fixed prefixes take constant work, without decoded-pixel allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work One probe result may be cached by the production closure per asset identity, outside this pure reader.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a small facts record escapes; no byte buffer, decoder, file or host task is retained.
 */
export const readAutoMovieImageFacts: (bytes: Uint8Array | null | undefined) => IAutoMovieTextureImageFacts | null = (
  bytes: Uint8Array | null | undefined,
): IAutoMovieTextureImageFacts | null => {
  if (bytes === null || bytes === undefined) return null;
  return readPng(bytes) ?? readJpeg(bytes) ?? readWebp(bytes) ?? readHdr(bytes);
};

/** `\x89PNG\r\n\x1a\n`, then a 25-byte IHDR whose first two fields are the size. */
const PNG_SIGNATURE: number[] = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/**
 * Read width/height from the24-byte PNG signature/IHDR prefix.
 *
 * Fixed offsets isolate this container's dimension extraction.
 *
 * Chunk length, CRC and pixel payload are not checked, so header facts do not prove a complete PNG.
 *
 * The minimum prefix and media/dimension return versus null are explicit.
 *
 * Eight signature comparisons and fixed field reads take constant work.
 *
 * Shared ascii/beUint32 helpers decode header bytes without a pixel decoder.
 *
 * Only scalar facts escape; the source buffer remains borrowed.
 */
const readPng: (bytes: Uint8Array) => IAutoMovieTextureImageFacts | null = (bytes: Uint8Array): IAutoMovieTextureImageFacts | null => {
  if (bytes.length < 24) return null;
  if (PNG_SIGNATURE.some((byte: number, index: number): boolean => bytes[index] !== byte)) return null;
  if (ascii(bytes, 12, 4) !== "IHDR") return null;
  return {
    mediaType: "image/png",
    width: beUint32(bytes, 16),
    height: beUint32(bytes, 20),
  };
};

/**
 * The frame-header markers that carry a JPEG's dimensions.
 *
 * `0xC0`–`0xCF` are start-of-frame EXCEPT `0xC4` (Huffman tables), `0xC8` (a
 * reserved JPEG extension) and `0xCC` (arithmetic coding conditioning), which
 * are ordinary segments that happen to sit in the same range. Reading a size
 * out of one of those would report a table length as a pixel count.
 */
const SOF_MARKERS: ReadonlySet<number> = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

/**
 * Walk JPEG marker segments to the first admitted SOF marker and extract dimensions.
 *
 * Marker lengths advance one cursor; DRI state governs standalone restart-marker admission.
 *
 * SOF extraction only requires dimension bytes, not a complete valid frame segment or decodable scan payload.
 *
 * Unsupported/truncated marker walks return null and recognized SOF returns header facts.
 *
 * Inspected bytes/marker segments drive linear scanning with constant working state.
 *
 * SOF_MARKERS and endian readers are shared; no byte-identity cache is retained.
 *
 * Only a facts row escapes; no decoded pixel or source buffer is retained.
 */
const readJpeg: (bytes: Uint8Array) => IAutoMovieTextureImageFacts | null = (bytes: Uint8Array): IAutoMovieTextureImageFacts | null => {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let cursor: number = 2;
  let restartInterval: number = 0;
  while (cursor + 1 < bytes.length) {
    if (bytes[cursor] !== 0xff) return null;
    // A marker may be preceded by any number of 0xFF fill bytes.
    let marker: number = bytes[cursor + 1]!;
    while (marker === 0xff) {
      cursor += 1;
      if (cursor + 1 >= bytes.length) return null;
      marker = bytes[cursor + 1]!;
    }
    cursor += 2;
    // Standalone markers carry no length word: restart, TEM, and a second SOI.
    if (marker >= 0xd0 && marker <= 0xd7) {
      if (restartInterval === 0) return null;
      continue;
    }
    if (marker === 0x01 || marker === 0xd8) continue;
    if (cursor + 1 >= bytes.length) return null;
    const length: number = beUint16(bytes, cursor);
    if (length < 2) return null;
    if (marker === 0xdd) {
      if (length !== 4 || cursor + length > bytes.length) return null;
      restartInterval = beUint16(bytes, cursor + 2);
    }
    if (SOF_MARKERS.has(marker)) {
      if (cursor + 6 >= bytes.length) return null;
      return {
        mediaType: "image/jpeg",
        height: beUint16(bytes, cursor + 3),
        width: beUint16(bytes, cursor + 5),
      };
    }
    cursor += length;
  }
  return null;
};

/**
 * Read RIFF/WEBP first-chunk dimensions from VP8, VP8L or VP8X prefixes.
 *
 * Each closed header variant owns its fixed offsets and packed bit widths.
 *
 * RIFF/chunk lengths and complete image payloads are not validated.
 *
 * The three supported prefix forms return media/dimensions or null.
 *
 * Fixed bounded prefixes require constant reads and a small facts allocation.
 *
 * ascii and little-endian owners are shared across variants.
 *
 * No decoder/byte buffer is retained after returning scalar facts.
 */
const readWebp: (bytes: Uint8Array) => IAutoMovieTextureImageFacts | null = (bytes: Uint8Array): IAutoMovieTextureImageFacts | null => {
  if (bytes.length < 30) return null;
  if (ascii(bytes, 0, 4) !== "RIFF" || ascii(bytes, 8, 4) !== "WEBP")
    return null;
  const chunk: string = ascii(bytes, 12, 4);
  if (chunk === "VP8 ") {
    if (bytes[23] !== 0x9d || bytes[24] !== 0x01 || bytes[25] !== 0x2a)
      return null;
    return {
      mediaType: "image/webp",
      width: leUint16(bytes, 26) & 0x3fff,
      height: leUint16(bytes, 28) & 0x3fff,
    };
  }
  if (chunk === "VP8L") {
    if (bytes[20] !== 0x2f) return null;
    const packed: number =
      bytes[21]! | (bytes[22]! << 8) | (bytes[23]! << 16) | (bytes[24]! << 24);
    return {
      mediaType: "image/webp",
      width: (packed & 0x3fff) + 1,
      height: ((packed >>> 14) & 0x3fff) + 1,
    };
  }
  if (chunk === "VP8X")
    return {
      mediaType: "image/webp",
      width: leUint24(bytes, 24) + 1,
      height: leUint24(bytes, 27) + 1,
    };
  return null;
};

/**
 * Inspect the capped ASCII header for the accepted Radiance signature and -Y/+X resolution line.
 *
 * A bounded header regex avoids scanning or decoding radiance pixels.
 *
 * Only the supported axis spelling is recognized, and FORMAT/pixel payload completeness is not certified.
 *
 * Null means no accepted dimension header, not proof of an invalid complete container.
 *
 * At most512 bytes are converted/searched, with bounded temporary text.
 *
 * ascii provides the shared byte-to-header conversion; current bytes are probed anew.
 *
 * Only width/height facts escape; temporary header text releases without a decoder.
 */
const readHdr: (bytes: Uint8Array) => IAutoMovieTextureImageFacts | null = (bytes: Uint8Array): IAutoMovieTextureImageFacts | null => {
  const head: string = ascii(bytes, 0, Math.min(bytes.length, 512));
  if (!head.startsWith("#?RADIANCE\n") && !head.startsWith("#?RGBE\n"))
    return null;
  const lines: string[] = head.split("\n");
  const blank: number = lines.indexOf("", 1);
  if (blank < 0) return null;
  const resolution: string = lines[blank + 1];
  if (resolution === undefined) return null;
  const parsed: RegExpExecArray | null = /^-Y (\d+) \+X (\d+)$/.exec(resolution);
  if (parsed === null) return null;
  return {
    mediaType: "image/vnd.radiance",
    width: Number.parseInt(parsed[2]!, 10),
    height: Number.parseInt(parsed[1]!, 10),
  };
};

/**
 * Convert a bounded byte range to character codes for container header comparison.
 *
 * A local loop avoids whole-buffer decoding for short magic/size headers.
 *
 * Offsets/counts are caller-owned admitted prefix bounds, not a generic file parser.
 *
 * It returns fresh text from the requested byte interval.
 *
 * Requested count drives linear character construction/storage.
 *
 * PNG/WebP/HDR readers reuse the same header conversion.
 *
 * Only the returned string survives; source bytes remain borrowed.
 */
const ascii: (bytes: Uint8Array, offset: number, length: number) => string = (bytes: Uint8Array, offset: number, length: number): string =>
  String.fromCharCode(...bytes.subarray(offset, offset + length));

/**
 * Combine four big-endian bytes into an unsigned numeric header field.
 *
 * Byte-order arithmetic is shared by PNG dimension reads.
 *
 * The caller must establish four available bytes; missing input is not repaired.
 *
 * Offset identifies the first byte and output represents an unsigned32-bit quantity.
 *
 * Four reads and fixed arithmetic take constant work.
 *
 * PNG width/height share this decoder without retaining offsets/results.
 *
 * Only a scalar returns, with no buffer or parser state retained.
 */
const beUint32: (bytes: Uint8Array, offset: number) => number = (bytes: Uint8Array, offset: number): number =>
  bytes[offset]! * 0x1000000 +
  (bytes[offset + 1]! << 16) +
  (bytes[offset + 2]! << 8) +
  bytes[offset + 3]!;

/**
 * Combine two big-endian bytes for JPEG lengths and dimensions.
 *
 * One endian owner serves marker traversal and SOF extraction.
 *
 * Callers establish the two-byte bounds before reading.
 *
 * The offset and unsigned16-bit result semantics are stated.
 *
 * Two reads and fixed arithmetic take constant work.
 *
 * JPEG segment/dimension reads share this operation.
 *
 * The borrowed buffer is not retained and only a scalar escapes.
 */
const beUint16: (bytes: Uint8Array, offset: number) => number = (bytes: Uint8Array, offset: number): number =>
  (bytes[offset]! << 8) | bytes[offset + 1]!;

/**
 * Combine two little-endian bytes for WebP dimension fields.
 *
 * The endian rule is separate from variant bit masks.
 *
 * The caller admits available bytes before this unchecked reader.
 *
 * The offset and unsigned16-bit result are explicit.
 *
 * Two reads and fixed arithmetic take constant work.
 *
 * The lossy prefix uses the same operation for both dimensions.
 *
 * Only the numeric result escapes; no buffer state remains.
 */
const leUint16: (bytes: Uint8Array, offset: number) => number = (bytes: Uint8Array, offset: number): number =>
  bytes[offset]! | (bytes[offset + 1]! << 8);

/**
 * Combine three little-endian bytes for extended WebP canvas fields.
 *
 * One fixed-width reader supports both canvas edges.
 *
 * Available prefix bytes are a caller premise rather than silently padded input.
 *
 * The result is an unsigned24-bit header quantity before the caller adds one.
 *
 * Three reads take constant work without collection allocation.
 *
 * Extended WebP width/height share this byte-order operation.
 *
 * Only a scalar escapes and source bytes remain borrowed.
 */
const leUint24: (bytes: Uint8Array, offset: number) => number = (bytes: Uint8Array, offset: number): number =>
  bytes[offset]! | (bytes[offset + 1]! << 8) | (bytes[offset + 2]! << 16);
