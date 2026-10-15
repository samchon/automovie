import { encodeAutoMoviePng } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import zlib from "node:zlib";

import { throwsError } from "../internal/predicates";

/** One decoded chunk of a PNG file. */
interface IChunk {
  type: string;
  data: Buffer;
  crcValid: boolean;
}

/**
 * Split a PNG file into its chunks after the signature, checking each CRC with Node's zlib CRC-32.
 *
 * @param file The PNG bytes
 * @returns Chunks in order
 */
function chunks(file: Buffer): IChunk[] {
  const out: IChunk[] = [];
  for (let at: number = 8; at < file.length; ) {
    const length: number = file.readUInt32BE(at);
    const type: string = file.toString("latin1", at + 4, at + 8);
    const data: Buffer = file.subarray(at + 8, at + 8 + length);
    out.push({
      type,
      data,
      crcValid:
        zlib.crc32(file.subarray(at + 4, at + 8 + length)) ===
        file.readUInt32BE(at + 8 + length),
    });
    at += 12 + length;
  }
  return out;
}

/**
 * Encoded PNGs decode, with Node's own zlib, to the exact pixels and header that went in.
 *
 * Scenarios:
 *
 * 1. A 3 by 2 RGBA image round-trips: signature, IHDR fields (size, depth 8, colour type 6, no interlace), valid CRCs, and the inflated scanlines equal filter byte 0 plus each source row.
 * 2. A 200 by 120 RGB image, whose filtered stream exceeds one 65,535-byte stored block, inflates to its pixels with colour type 2.
 * 3. A 1 by 1 grey image takes colour type 0, and the base64 decodes with Node's decoder to the same file.
 * 4. A zero width, a fractional height, five channels and a short pixel buffer are refused.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls encodeAutoMoviePng and decodes its output with Node's Buffer base64, zlib.inflateSync and zlib.crc32, so a wrong chunk layout, checksum, block header, Adler-32 or row filter fails decoding or the pixel comparison.
 * @evidence contracts/testing.md#independent-expectations Expected bytes are the input pixels with a zero filter byte per row and the header fields the W3C PNG specification assigns to each channel count; Node's zlib is an independent inflater and CRC implementation, not the encoder under test.
 * @evidence contracts/testing.md#distinguishing-cases Covers RGBA, RGB across a stored-block boundary, the 1 by 1 singleton in grey, and four malformed inputs; viewer decoding of model images is owned by the viewer's texture tests.
 * @evidence contracts/testing.md#execution-ownership Unit test test_render_png_encoding runs portable synchronous encoding and Node's built-in zlib, without a browser, GPU or process.
 */
export function test_render_png_encoding(): void {
  const decode = (
    width: number,
    height: number,
    channels: 1 | 2 | 3 | 4,
    pixels: Uint8Array,
  ): { header: Buffer; scanlines: Buffer; chunks: IChunk[]; file: Buffer } => {
    const file: Buffer = Buffer.from(
      encodeAutoMoviePng({ width, height, channels, pixels }),
      "base64",
    );
    TestValidator.equals(
      "signature",
      [...file.subarray(0, 8)],
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    );
    const list: IChunk[] = chunks(file);
    const idat: Buffer = Buffer.concat(
      list.filter((c: IChunk): boolean => c.type === "IDAT").map((c) => c.data),
    );
    return {
      header: list[0]!.data,
      scanlines: zlib.inflateSync(idat),
      chunks: list,
      file,
    };
  };
  const expected = (
    width: number,
    height: number,
    channels: number,
    pixels: Uint8Array,
  ): number[] => {
    const out: number[] = [];
    for (let y: number = 0; y < height; ++y)
      out.push(
        0,
        ...pixels.subarray(y * width * channels, (y + 1) * width * channels),
      );
    return out;
  };

  // 1. RGBA
  const rgba: Uint8Array = Uint8Array.from(
    { length: 3 * 2 * 4 },
    (_: unknown, i: number): number => (i * 37 + 11) & 0xff,
  );
  const small: ReturnType<typeof decode> = decode(3, 2, 4, rgba);
  TestValidator.equals(
    "chunk order",
    small.chunks.map((c: IChunk): string => c.type),
    ["IHDR", "IDAT", "IEND"],
  );
  TestValidator.equals(
    "every CRC is valid",
    small.chunks.every((c: IChunk): boolean => c.crcValid),
    true,
  );
  TestValidator.equals(
    "IHDR",
    [
      small.header.readUInt32BE(0),
      small.header.readUInt32BE(4),
      small.header[8],
      small.header[9],
      small.header[10],
      small.header[11],
      small.header[12],
    ],
    [3, 2, 8, 6, 0, 0, 0],
  );
  TestValidator.equals(
    "RGBA scanlines",
    [...small.scanlines],
    expected(3, 2, 4, rgba),
  );

  // 2. RGB across a stored-block boundary
  const rgb: Uint8Array = Uint8Array.from(
    { length: 200 * 120 * 3 },
    (_: unknown, i: number): number => (i * 7 + (i >> 9)) & 0xff,
  );
  const large: ReturnType<typeof decode> = decode(200, 120, 3, rgb);
  TestValidator.equals("RGB colour type", large.header[9], 2);
  TestValidator.equals(
    "RGB scanlines over two stored blocks",
    [...large.scanlines],
    expected(200, 120, 3, rgb),
  );

  // 3. grey singleton
  const grey: ReturnType<typeof decode> = decode(1, 1, 1, Uint8Array.of(200));
  TestValidator.equals("grey colour type", grey.header[9], 0);
  TestValidator.equals("grey scanline", [...grey.scanlines], [0, 200]);
  TestValidator.equals(
    "base64 round trip",
    grey.file.toString("base64"),
    encodeAutoMoviePng({
      width: 1,
      height: 1,
      channels: 1,
      pixels: Uint8Array.of(200),
    }),
  );

  // 4. refusals
  for (const [title, props, message] of [
    [
      "zero width",
      { width: 0, height: 1, channels: 1, pixels: new Uint8Array(0) },
      "width",
    ],
    [
      "fractional height",
      { width: 1, height: 1.5, channels: 1, pixels: new Uint8Array(1) },
      "height",
    ],
    [
      "five channels",
      { width: 1, height: 1, channels: 5, pixels: new Uint8Array(5) },
      "channels",
    ],
    [
      "short buffer",
      { width: 2, height: 2, channels: 3, pixels: new Uint8Array(11) },
      "12 bytes",
    ],
  ] as const)
    TestValidator.equals(
      `refuses ${title}`,
      throwsError(
        (): string =>
          encodeAutoMoviePng(props as Parameters<typeof encodeAutoMoviePng>[0]),
        message,
      ),
      true,
    );
}
