import { digestAutoMovieBytes as digestAutoMovieBytesImplementation } from "./internal/digestAutoMovieBytes";
import { type IAutoMovieEncodePng } from "@automovie/interface";
import { encodeAutoMoviePng as encodeAutoMoviePngImplementation } from "./internal/encodeAutoMoviePng";
import { utf8Bytes as utf8BytesImplementation } from "./internal/utf8Bytes";

/** Public operations for Auto Movie Engine Picture. */
export namespace AutoMovieEnginePicture {
  /**
   * SHA-256 (FIPS 180-4) of a byte sequence, as `sha256:` and lowercase
   * hexadecimal, in synchronous pure TypeScript.
   *
   * The engine runs in the viewer's browser bundle as well as in Node, so it
   * cannot reach `node:crypto`, and `SubtleCrypto` is asynchronous and absent
   * outside a secure context. The transform is therefore written out with 32-bit
   * integer arithmetic normalized by `>>> 0`, so every platform produces the
   * digest `createHash("sha256")` produces for the same bytes. Whole blocks are
   * read straight from the input; only the final one or two padded blocks are
   * copied.
   *
   * @param bytes The bytes to digest; only read.
   * @returns `sha256:` followed by 64 lowercase hexadecimal digits.
   */
  export function digestAutoMovieBytes(bytes: Uint8Array): string {
    return digestAutoMovieBytesImplementation(bytes);
  }

  /**
   * Encode raw 8-bit pixels as a PNG file in the padded base64 an
   * `IAutoMovieImage` carries, for an image code generates together with a
   * model.
   *
   * The file is a signature, `IHDR`, one `IDAT` and `IEND` (PNG, W3C second
   * edition, sections 5, 11.2): bit depth 8, non-interlaced, colour type 0, 4, 2
   * or 6 for one to four channels, which is the subset engine admission and the
   * viewer decode. Each scanline takes filter type 0, and the zlib stream (RFC
   * 1950) holds the filtered bytes in stored deflate blocks of at most 65,535
   * bytes (RFC 1951 section 3.2.4), with the Adler-32 of the uncompressed data;
   * each chunk ends in the CRC-32 of its type and data. Stored blocks keep the
   * encoder a few lines and the output a pure function of the pixels, at the cost
   * of no compression: the file is the raw size plus about 0.1 percent. Base64
   * follows RFC 4648 section 4 without `Buffer` or `btoa`, so the bytes are the
   * same in Node and every browser.
   *
   * @param props.width Image width in pixels, a positive integer
   * @param props.height Image height in pixels, a positive integer
   * @param props.channels Samples per pixel: 1 grey, 2 grey and alpha, 3 RGB, 4
   *   RGBA
   * @param props.pixels Row-major samples, the first row first, `width * height *
   *   channels` bytes; only read
   * @returns Padded base64 of the PNG file, without a `data:` prefix
   * @throws {Error} When a dimension is not a positive integer, the channel count
   *   is not 1 to 4, or the pixel buffer has the wrong length
   */
  export function encodeAutoMoviePng(props: IAutoMovieEncodePng.IProps): string {
    return encodeAutoMoviePngImplementation(props);
  }

  /**
   * Encode a string as UTF-8 bytes without `TextEncoder`.
   *
   * `TextEncoder` is present in Node 22 and in every browser, but not in every
   * embedder the viewer is dropped into, and a digest that silently changes when
   * a polyfill differs is worse than a loop. Lone surrogates encode as U+FFFD,
   * which is what `TextEncoder` does, so an id carrying broken UTF-16 still
   * digests identically on both sides.
   */
  export function utf8Bytes(text: string): number[] {
    return utf8BytesImplementation(text);
  }
}
