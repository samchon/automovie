/**
 * Decode one raw P6 RGB8 image under an explicitly supplied transfer convention.
 * The standalone @automovie/ingest/ppm entry exposes this codec without the
 * broader glTF SDK's runtime imports or declaration-library requirements.
 * The initial subset admits maxval 255, comments before numeric header tokens
 * and exactly one whitespace byte between maxval and raster. It rejects P3,
 * 16-bit samples, image sequences and trailing bytes. A raster byte that happens
 * to be whitespace or '#' is pixel data and is never skipped.
 * Netpbm normally specifies BT.709; sRGB is its documented common variation.
 * The decoder preserves samples without performing colour conversion.
 * See https://netpbm.sourceforge.net/doc/ppm.html.
 *
 * @evidence contracts/common.md#principled-implementation The documented P6 header and exact RGB raster length determine decoding; explicit transfer metadata avoids relabeling standard BT.709 samples as sRGB. Pixel/header budgets are validated before the detached output allocation.
 * @evidence contracts/common.md#clear-and-simple-design This renderer-free byte codec performs only admission and RGB extraction; capture calibration, foreground observation and source publication remain with their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No header repair, ignored trailing image, post-header whitespace skipping, unsupported maxval rescaling or implicit colour conversion changes fixed bytes.
 * @evidence contracts/common.md#meaningful-documentation States the admitted P6 subset, comments, delimiter/raster distinction, detached ownership, transfer declaration, unsupported variants and budget refusal.
 * @evidence contracts/performance.md#efficient-algorithms Parsing costs O(H) for admitted header bytes and one O(P) RGB copy for P pixels; maxHeaderBytes and maxPixels bound both populations before allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each synchronous call decodes caller-supplied fixed bytes once and defines no cross-request cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns one detached RGB8 result; borrowed source bytes and constant header scratch are released from the call without handles or global retention.
 */
export function decodeAutoMoviePpmImage(
  bytes: Uint8Array,
  options: {
    maxPixels: number;
    maxHeaderBytes: number;
    transfer: "srgb" | "bt709" | "linear";
  },
): {
  width: number;
  height: number;
  rgb8: Uint8Array;
  transfer: "srgb" | "bt709" | "linear";
} {
  if (
    !(bytes instanceof Uint8Array) ||
    !options ||
    !Number.isSafeInteger(options.maxPixels) ||
    options.maxPixels <= 0 ||
    !Number.isSafeInteger(options.maxHeaderBytes) ||
    options.maxHeaderBytes <= 0 ||
    !["srgb", "bt709", "linear"].includes(options.transfer)
  )
    throw new Error(
      "PPM decoding requires bytes, explicit transfer and positive integer budgets",
    );
  const whitespace: (byte: number) => boolean = (byte: number): boolean =>
    byte === 32 || (byte >= 9 && byte <= 13);
  if (bytes[0] !== 80 || bytes[1] !== 54 || !whitespace(bytes[2]))
    throw new Error("Only a raw P6 image is supported");
  let cursor: number = 2;
  const advance: () => void = (): void => {
    if (++cursor > options.maxHeaderBytes || cursor >= bytes.length)
      throw new Error("PPM header is truncated or exceeds maxHeaderBytes");
  };
  const token: () => number = (): number => {
    while (cursor < bytes.length) {
      if (bytes[cursor] === 35) {
        while (bytes[cursor] !== 10 && bytes[cursor] !== 13) advance();
      } else if (!whitespace(bytes[cursor])) break;
      advance();
    }
    let value: number = 0,
      digits: number = 0;
    while (bytes[cursor] >= 48 && bytes[cursor] <= 57) {
      value = value * 10 + bytes[cursor] - 48;
      digits++;
      if (!Number.isSafeInteger(value))
        throw new Error("PPM numeric header exceeds safe integer precision");
      advance();
    }
    if (!digits || !(whitespace(bytes[cursor]) || bytes[cursor] === 35))
      throw new Error("PPM header requires decimal integer tokens");
    return value;
  };
  const width: number = token(),
    height: number = token(),
    maximum: number = token();
  if (maximum !== 255)
    throw new Error("Only maxval 255 RGB8 PPM images are supported");
  if (!whitespace(bytes[cursor]) || cursor + 1 > options.maxHeaderBytes)
    throw new Error(
      "PPM raster needs exactly one whitespace delimiter within the header budget",
    );
  cursor++;
  const pixels: number = width * height;
  if (
    width <= 0 ||
    height <= 0 ||
    !Number.isSafeInteger(pixels) ||
    pixels > options.maxPixels
  )
    throw new Error("PPM dimensions are invalid or exceed maxPixels");
  if (bytes.length - cursor !== 3 * pixels)
    throw new Error(
      "PPM requires exactly one complete RGB8 raster without trailing bytes",
    );
  return {
    width,
    height,
    rgb8: new Uint8Array(bytes.subarray(cursor)),
    transfer: options.transfer,
  };
}
