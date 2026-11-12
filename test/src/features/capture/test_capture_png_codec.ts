import {
  type IAutoMovieRasterImage,
  decodeAutoMovieRasterPng,
  encodeAutoMovieRasterPng,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import zlib from "node:zlib";

import { rejectsError } from "../internal/rejectsError";

/** A PNG file built with Node's own zlib from header fields and filtered rows, as an independent encoder. */
function png(
  header: {
    width: number;
    height: number;
    depth: number;
    colour: number;
    interlace?: number;
  },
  rows: number[][],
  extra: [string, number[]][] = [],
  split: number = 1,
): Uint8Array {
  const chunk: (type: string, data: Buffer) => Buffer = (
    type: string,
    data: Buffer,
  ): Buffer => {
    const out: Buffer = Buffer.alloc(12 + data.length);
    out.writeUInt32BE(data.length, 0);
    out.write(type, 4, "latin1");
    data.copy(out, 8);
    out.writeUInt32BE(
      zlib.crc32(out.subarray(4, 8 + data.length)),
      8 + data.length,
    );
    return out;
  };
  const ihdr: Buffer = Buffer.alloc(13);
  ihdr.writeUInt32BE(header.width, 0);
  ihdr.writeUInt32BE(header.height, 4);
  ihdr.set([header.depth, header.colour, 0, 0, header.interlace ?? 0], 8);
  const data: Buffer = zlib.deflateSync(Buffer.from(rows.flat()));
  const parts: Buffer[] = [];
  const size: number = Math.ceil(data.length / split);
  for (let at: number = 0; at < data.length; at += size)
    parts.push(chunk("IDAT", data.subarray(at, at + size)));
  return new Uint8Array(
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk("IHDR", ihdr),
      ...extra.map(
        ([type, bytes]: [string, number[]]): Buffer =>
          chunk(type, Buffer.from(bytes)),
      ),
      ...parts,
      chunk("IEND", Buffer.alloc(0)),
    ]),
  );
}

/**
 * PNG stills are written and read by the render package alone, through `CompressionStream` and `DecompressionStream`: a picture it encodes decodes to the same pixels, and it reads the colour types, depths and row filters other encoders such as FFmpeg write.
 *
 * Scenarios:
 *
 * 1. A 7 by 5 picture of distinct colours encodes and decodes to the same RGB with opaque alpha, and its file starts with the PNG signature and decodes with Node's zlib to filter-0 rows.
 * 2. A 3 by 2 RGB file using filters Sub, Up, Average and Paeth across its rows, and split over two IDAT chunks, decodes to the authored pixels.
 * 3. A 1-bit grey file, a 2-bit palette file, a 16-bit RGBA file and an 8-bit grey-alpha file decode to the authored 8-bit RGBA.
 * 4. A file without the signature, a chunk with a wrong CRC, an interlaced file and a picture whose buffer disagrees with its size are refused with the reason.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Encodes and decodes through the public functions and compares pixels; a codec that dropped a row, mishandled a filter, scaled a sub-byte sample wrongly or accepted a corrupt chunk fails.
 * @evidence contracts/development/testing.md#independent-expectations Files for scenarios 2 to 4 are built here with Node's zlib from rows filtered by hand per the PNG specification, and scenario 1's file is inflated with Node's zlib, so neither side relies on the code under test.
 * @evidence contracts/development/testing.md#distinguishing-cases Every row filter, sub-byte, 8-bit and 16-bit depths, palette and grey forms, one IDAT against two, and each refusal against a valid file. Hashes of decoded stills are owned by `test_capture_still_hash`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_capture_png_codec`; it builds every file in memory.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export async function test_capture_png_codec(): Promise<void> {
  const rgba: (image: IAutoMovieRasterImage) => number[] = (
    image: IAutoMovieRasterImage,
  ): number[] => Array.from(image.pixels);

  // 1. Round trip.
  const pixels: Uint8ClampedArray = new Uint8ClampedArray(7 * 5 * 4);
  for (let index: number = 0; index < 35; index++)
    pixels.set(
      [index * 7, 255 - index * 5, (index * 37) % 256, 255],
      index * 4,
    );
  const picture: IAutoMovieRasterImage = { width: 7, height: 5, pixels };
  const file: Uint8Array = await encodeAutoMovieRasterPng(picture);
  TestValidator.equals(
    "the picture reads back",
    rgba(await decodeAutoMovieRasterPng(file)),
    Array.from(pixels),
  );
  const idat: number = Buffer.from(file).indexOf("IDAT");
  const inflated: Buffer = zlib.inflateSync(
    Buffer.from(
      file.subarray(
        idat + 4,
        idat + 4 + Buffer.from(file).readUInt32BE(idat - 4),
      ),
    ),
  );
  TestValidator.equals(
    "rows are filter 0 and RGB",
    [inflated.length, inflated[0], Array.from(inflated.subarray(1, 4))],
    [5 * (1 + 7 * 3), 0, [0, 255, 0]],
  );

  // 2. Every row filter, over two IDAT chunks. Raw rows: [10,20,30, 40,50,60, 70,80,90] and [15,25,35, 45,55,65, 75,85,95].
  const filtered: IAutoMovieRasterImage = await decodeAutoMovieRasterPng(
    png(
      { width: 3, height: 2, depth: 8, colour: 2 },
      [
        // Sub: each byte minus the byte three before it.
        [1, 10, 20, 30, 30, 30, 30, 30, 30, 30],
        // Paeth: each byte's predictor is whichever of left, up and corner lies nearest left + up - corner, here always up.
        [4, 5, 5, 5, 5, 5, 5, 5, 5, 5],
      ],
      [],
      2,
    ),
  );
  TestValidator.equals(
    "Sub and Paeth rows decode",
    rgba(filtered),
    [
      10, 20, 30, 255, 40, 50, 60, 255, 70, 80, 90, 255, 15, 25, 35, 255, 45,
      55, 65, 255, 75, 85, 95, 255,
    ],
  );
  const averaged: IAutoMovieRasterImage = await decodeAutoMovieRasterPng(
    png({ width: 2, height: 2, depth: 8, colour: 2 }, [
      [0, 100, 100, 100, 200, 200, 200],
      // Average: each byte's predictor is floor((left + up) / 2).
      [3, 10, 20, 30, 85, 80, 75],
    ]),
  );
  TestValidator.equals(
    "Average rows decode",
    rgba(averaged),
    [
      100, 100, 100, 255, 200, 200, 200, 255, 60, 70, 80, 255, 215, 215, 215,
      255,
    ],
  );
  const upped: IAutoMovieRasterImage = await decodeAutoMovieRasterPng(
    png({ width: 1, height: 2, depth: 8, colour: 2 }, [
      [0, 1, 2, 3],
      [2, 4, 4, 4],
    ]),
  );
  TestValidator.equals(
    "Up rows decode",
    rgba(upped),
    [1, 2, 3, 255, 5, 6, 7, 255],
  );

  // 3. Other colour types and depths.
  TestValidator.equals(
    "1-bit grey",
    rgba(
      await decodeAutoMovieRasterPng(
        png({ width: 3, height: 1, depth: 1, colour: 0 }, [[0, 0b10100000]]),
      ),
    ),
    [255, 255, 255, 255, 0, 0, 0, 255, 255, 255, 255, 255],
  );
  TestValidator.equals(
    "2-bit palette",
    rgba(
      await decodeAutoMovieRasterPng(
        png(
          { width: 2, height: 1, depth: 2, colour: 3 },
          [[0, 0b10010000]],
          [["PLTE", [1, 2, 3, 4, 5, 6, 7, 8, 9]]],
        ),
      ),
    ),
    [7, 8, 9, 255, 4, 5, 6, 255],
  );
  TestValidator.equals(
    "16-bit RGBA keeps the high byte",
    rgba(
      await decodeAutoMovieRasterPng(
        png({ width: 1, height: 1, depth: 16, colour: 6 }, [
          [0, 0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0],
        ]),
      ),
    ),
    [0x12, 0x56, 0x9a, 0xde],
  );
  TestValidator.equals(
    "grey with alpha",
    rgba(
      await decodeAutoMovieRasterPng(
        png({ width: 1, height: 1, depth: 8, colour: 4 }, [[0, 77, 128]]),
      ),
    ),
    [77, 77, 77, 128],
  );

  // 4. Refusals.
  const good: Uint8Array = png({ width: 1, height: 1, depth: 8, colour: 2 }, [
    [0, 1, 2, 3],
  ]);
  const corrupt: Uint8Array = new Uint8Array(good);
  corrupt[corrupt.length - 13] ^= 0xff;
  for (const [title, bytes, fragment] of [
    ["no signature", good.subarray(1), "not a PNG"],
    ["a wrong CRC", corrupt, "CRC"],
    [
      "an interlaced file",
      png({ width: 1, height: 1, depth: 8, colour: 2, interlace: 1 }, [
        [0, 1, 2, 3],
      ]),
      "Interlaced",
    ],
  ] as const)
    TestValidator.predicate(
      `${title} is refused`,
      await rejectsError(
        (): Promise<unknown> => decodeAutoMovieRasterPng(bytes),
        fragment,
      ),
    );
  TestValidator.predicate(
    "a buffer that disagrees with its size is refused",
    await rejectsError(
      (): Promise<unknown> =>
        encodeAutoMovieRasterPng({
          width: 2,
          height: 2,
          pixels: new Uint8ClampedArray(12),
        }),
      "do not match",
    ),
  );
}
