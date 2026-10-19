import { decodeAutoMoviePpmImage } from "@automovie/ingest";
import { TestValidator } from "@nestia/e2e";

/**
 * Raw P6 admission distinguishes raster bytes from header whitespace/comments.
 *
 * Scenarios:
 * 1. A two-pixel P6 image with header comments preserves RGB bytes and transfer.
 * 2. A whitespace/'#' raster prefix is retained and returned storage is detached.
 * 3. Unsupported magic/maxval, malformed/truncated headers, trailing bytes and resource exhaustion refuse.
 *
 * @evidence contracts/testing.md#behavioral-verification Executes the byte decoder, asserts exact decoded integer channels and detached ownership, and observes thrown errors for unsupported formats and budgets.
 * @evidence contracts/testing.md#independent-expectations The Netpbm P6 specification defines ASCII decimal dimensions, one post-maxval whitespace byte and exactly width times height RGB triplets; the handwritten six raster bytes are independent of the decoder.
 * @evidence contracts/testing.md#distinguishing-cases Covers comments, tabs, raster whitespace/hash, source mutation, P3, 16-bit maxval, malformed numeric tokens, zero/oversized dimensions, truncation, trailing bytes, header limits and invalid transfer. Calibration and multiview fitting belong to recovery tests.
 * @evidence contracts/testing.md#execution-ownership The portable test_ingest_ppm_image entry reaches resident byte semantics directly and uses no file, installation, native artifact, browser, GPU or foreign-method replacement.
 */
export function test_ingest_ppm_image(): void {
  const make: (header: string, pixels?: number[]) => Uint8Array = (
    header: string,
    pixels: number[] = [10, 35, 32, 0, 127, 255],
  ): Uint8Array =>
    Uint8Array.from([...new TextEncoder().encode(header), ...pixels]);
  const bytes: Uint8Array = make("P6\n# RGB8 fixture\n2\t1\n255\n");
  const options: Parameters<typeof decodeAutoMoviePpmImage>[1] = {
    maxPixels: 2,
    maxHeaderBytes: 100,
    transfer: "srgb",
  };
  const result: ReturnType<typeof decodeAutoMoviePpmImage> =
    decodeAutoMoviePpmImage(bytes, options);
  TestValidator.equals("RGB dimensions", [result.width, result.height], [2, 1]);
  TestValidator.equals(
    "raster bytes including whitespace and hash preserved",
    Array.from(result.rgb8),
    [10, 35, 32, 0, 127, 255],
  );
  TestValidator.equals("explicit transfer preserved", result.transfer, "srgb");
  bytes[bytes.length - 1] = 1;
  TestValidator.equals("returned pixels detached", result.rgb8[5], 255);
  for (const invalid of [
    make("P3\n2 1\n255\n"),
    make("P6\n2 1\n65535\n"),
    make("P6\n2x 1\n255\n"),
    make("P6\n0 1\n255\n"),
    make("P6\n3 1\n255\n"),
    make("P6\n2 1\n255\n", [1]),
    make("P6\n2 1\n255\n", [1, 2, 3, 4, 5, 6, 7]),
    make("P6\n2 1\n255#comment\n"),
    new Uint8Array([80, 54, 10, 35]),
  ]) {
    let refused: boolean = false;
    try {
      decodeAutoMoviePpmImage(invalid, options);
    } catch {
      refused = true;
    }
    TestValidator.predicate("unsupported or malformed PPM refuses", refused);
  }
  for (const policy of [
    { ...options, maxPixels: 1 },
    { ...options, maxHeaderBytes: 5 },
    { ...options, transfer: "unknown" },
  ]) {
    let refused: boolean = false;
    try {
      decodeAutoMoviePpmImage(
        make("P6\n2 1\n255\n"),
        policy as Parameters<typeof decodeAutoMoviePpmImage>[1],
      );
    } catch {
      refused = true;
    }
    TestValidator.predicate("resource and transfer admission refuse", refused);
  }
}
