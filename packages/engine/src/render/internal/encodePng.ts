import type { IAutoMovieEncodePng } from "@automovie/interface";

/*
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
 * Parameter props.width: Image width in pixels, a positive integer
 * Parameter props.height: Image height in pixels, a positive integer
 * Parameter props.channels: Samples per pixel: 1 grey, 2 grey and alpha, 3 RGB, 4
 * RGBA
 * Parameter props.pixels: Row-major samples, the first row first, `width * height *
 * channels` bytes; only read
 * Returns: Padded base64 of the PNG file, without a `data:` prefix
 * When a dimension is not a positive integer, the channel count
 * is not 1 to 4, or the pixel buffer has the wrong length
 */
export function encodePng(props: IAutoMovieEncodePng.IProps): string {
  const { width, height, channels, pixels } = props;
  if (width < 1)
    throw new Error(`png width must be a positive integer, got ${width}`);
  if (height < 1)
    throw new Error(`png height must be a positive integer, got ${height}`);
  if (![1, 2, 3, 4].includes(channels))
    throw new Error(`png channels must be 1 to 4, got ${channels}`);
  const stride: number = width * channels;
  if (pixels.length !== stride * height)
    throw new Error(
      `png pixels must hold ${stride * height} bytes, got ${pixels.length}`,
    );

  // filtered scanlines, each led by filter type 0
  const raw: Uint8Array = new Uint8Array((stride + 1) * height);
  for (let y: number = 0; y < height; ++y)
    raw.set(
      pixels.subarray(y * stride, (y + 1) * stride),
      y * (stride + 1) + 1,
    );

  // zlib: header, stored blocks, Adler-32
  const blocks: number = Math.max(1, Math.ceil(raw.length / 65535));
  const zlib: Uint8Array = new Uint8Array(2 + raw.length + 5 * blocks + 4);
  zlib[0] = 0x78;
  zlib[1] = 0x01;
  let at: number = 2;
  for (let b: number = 0; b < blocks; ++b) {
    const from: number = b * 65535;
    const length: number = Math.min(65535, raw.length - from);
    zlib[at++] = b === blocks - 1 ? 1 : 0;
    zlib[at++] = length & 0xff;
    zlib[at++] = length >>> 8;
    zlib[at++] = ~length & 0xff;
    zlib[at++] = (~length >>> 8) & 0xff;
    zlib.set(raw.subarray(from, from + length), at);
    at += length;
  }
  let a: number = 1;
  let s: number = 0;
  for (let i: number = 0; i < raw.length; ++i) {
    a = (a + raw[i]!) % 65521;
    s = (s + a) % 65521;
  }
  writeUint32(zlib, at, ((s << 16) | a) >>> 0);

  const header: Uint8Array = new Uint8Array(13);
  writeUint32(header, 0, width);
  writeUint32(header, 4, height);
  header[8] = 8;
  header[9] = COLOR_TYPES[channels - 1]!;
  const file: Uint8Array = concat([
    SIGNATURE,
    chunk("IHDR", header),
    chunk("IDAT", zlib),
    chunk("IEND", new Uint8Array(0)),
  ]);
  return base64(file);
}

/*
 * `\x89PNG\r\n\x1a\n`.
 */
const SIGNATURE: Uint8Array = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

/*
 * PNG colour type for one to four channels: grey, grey-alpha, RGB, RGBA.
 */
const COLOR_TYPES: readonly number[] = [0, 4, 2, 6];

/*
 * Reflected CRC-32 table of polynomial 0xEDB88320 (PNG annex D).
 */
const CRC_TABLE: Uint32Array = ((): Uint32Array => {
  const table: Uint32Array = new Uint32Array(256);
  for (let n: number = 0; n < 256; ++n) {
    let c: number = n;
    for (let k: number = 0; k < 8; ++k)
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

/*
 * Base64 alphabet of RFC 4648 section 4.
 */
const ALPHABET: string =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/*
 * One chunk: length, type, data and the CRC-32 of type and data.
 * Parameter type: Four-letter chunk type
 * Parameter data: Chunk data
 * Returns: The chunk's bytes
 */
function chunk(type: string, data: Uint8Array): Uint8Array {
  const out: Uint8Array = new Uint8Array(12 + data.length);
  writeUint32(out, 0, data.length);
  for (let i: number = 0; i < 4; ++i) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  let crc: number = 0xffffffff;
  for (let i: number = 4; i < 8 + data.length; ++i)
    crc = CRC_TABLE[(crc ^ out[i]!) & 0xff]! ^ (crc >>> 8);
  writeUint32(out, 8 + data.length, (crc ^ 0xffffffff) >>> 0);
  return out;
}

/*
 * Write a big-endian unsigned 32-bit integer.
 * Parameter bytes: Target
 * Parameter at: Offset
 * Parameter value: Integer in `[0, 2^32)`
 */
function writeUint32(bytes: Uint8Array, at: number, value: number): void {
  bytes[at] = (value >>> 24) & 0xff;
  bytes[at + 1] = (value >>> 16) & 0xff;
  bytes[at + 2] = (value >>> 8) & 0xff;
  bytes[at + 3] = value & 0xff;
}

/*
 * Concatenate byte arrays.
 * Parameter parts: Arrays in order
 * Returns: One new array
 */
function concat(parts: Uint8Array[]): Uint8Array {
  const out: Uint8Array = new Uint8Array(
    parts.reduce((sum: number, p: Uint8Array): number => sum + p.length, 0),
  );
  let at: number = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

/*
 * Padded base64 of bytes.
 * Parameter bytes: Bytes to encode
 * Returns: The encoding
 */
function base64(bytes: Uint8Array): string {
  const out: string[] = [];
  for (let i: number = 0; i < bytes.length; i += 3) {
    const a: number = bytes[i]!;
    const b: number = i + 1 < bytes.length ? bytes[i + 1]! : 0;
    const c: number = i + 2 < bytes.length ? bytes[i + 2]! : 0;
    const n: number = (a << 16) | (b << 8) | c;
    out.push(
      ALPHABET[(n >>> 18) & 63]! +
        ALPHABET[(n >>> 12) & 63]! +
        (i + 1 < bytes.length ? ALPHABET[(n >>> 6) & 63]! : "=") +
        (i + 2 < bytes.length ? ALPHABET[n & 63]! : "="),
    );
  }
  return out.join("");
}
