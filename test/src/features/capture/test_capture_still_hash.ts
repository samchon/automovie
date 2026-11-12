import {
  type IAutoMovieRasterImage,
  decodeAutoMovieRasterPng,
  encodeAutoMovieRasterPng,
  hashAutoMovieRasterImage,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";

/**
 * A still's content hash is SHA-256 over its size and RGB bytes, so an unchanged still hashes alike across rounds and encoders, and any changed pixel or shape changes it.
 *
 * Scenarios:
 *
 * 1. For pictures of 1 by 1, 3 by 6, 15 by 1, 64 by 36 and 4 by 4 pixels, whose hashed messages of 53 and 56 bytes straddle SHA-256's padding boundary and of 6920 bytes span many blocks, the hash equals Node's `createHash("sha256")` over the same documented bytes.
 * 2. A picture and the picture decoded from its encoded PNG hash alike, and so do two pictures differing only in alpha.
 * 3. One changed channel of one pixel changes the hash, and so does the same bytes laid out 6 by 3 instead of 3 by 6.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Hashes real pictures through the public function and compares against an independent SHA-256 and against altered pictures; a hash over compressed bytes, over alpha, without the size, or with a padding error fails.
 * @evidence contracts/development/testing.md#independent-expectations Node's `crypto` SHA-256 over the documented message (big-endian width and height, then RGB rows) is the oracle; a message of 56 bytes or more is where SHA-256 padding needs a second block.
 * @evidence contracts/development/testing.md#distinguishing-cases Padding boundaries and multi-block messages, equal pixels through an encoder, alpha-only differences that must not count, and one-channel and shape differences that must. Hashes in a capture's record are owned by `test_capture_run_order` and `test_capture_round_comparison`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_capture_still_hash`; Node's crypto is the oracle only.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export async function test_capture_still_hash(): Promise<void> {
  const picture: (
    width: number,
    height: number,
    alpha?: number,
  ) => IAutoMovieRasterImage = (
    width: number,
    height: number,
    alpha: number = 255,
  ): IAutoMovieRasterImage => {
    const pixels: Uint8ClampedArray = new Uint8ClampedArray(width * height * 4);
    for (let index: number = 0; index < width * height; index++)
      pixels.set(
        [(index * 31) % 256, (index * 7 + 3) % 256, 255 - (index % 256), alpha],
        index * 4,
      );
    return { width, height, pixels };
  };
  const oracle: (image: IAutoMovieRasterImage) => string = (
    image: IAutoMovieRasterImage,
  ): string => {
    const message: Buffer = Buffer.alloc(8 + image.width * image.height * 3);
    message.writeUInt32BE(image.width, 0);
    message.writeUInt32BE(image.height, 4);
    for (let index: number = 0; index < image.width * image.height; index++)
      message.set(
        image.pixels.subarray(index * 4, index * 4 + 3),
        8 + index * 3,
      );
    return `sha256:${createHash("sha256").update(message).digest("hex")}`;
  };

  // 1. Against Node's SHA-256: messages of 11, 62, 53, 6920 and 56 bytes; 56 is the first length whose padding needs a second block, 53 fits one.
  for (const [width, height] of [
    [1, 1],
    [3, 6],
    [15, 1],
    [64, 36],
    [4, 4],
  ] as const) {
    const image: IAutoMovieRasterImage = picture(width, height);
    TestValidator.equals(
      `${width}x${height} matches SHA-256`,
      hashAutoMovieRasterImage(image),
      oracle(image),
    );
  }

  // 2. Equal pixels hash alike.
  const still: IAutoMovieRasterImage = picture(64, 36);
  TestValidator.equals(
    "a decoded still hashes as it was drawn",
    hashAutoMovieRasterImage(
      await decodeAutoMovieRasterPng(await encodeAutoMovieRasterPng(still)),
    ),
    hashAutoMovieRasterImage(still),
  );
  TestValidator.equals(
    "alpha does not count",
    hashAutoMovieRasterImage(picture(5, 5, 0)),
    hashAutoMovieRasterImage(picture(5, 5)),
  );

  // 3. Changes that must count.
  const changed: IAutoMovieRasterImage = picture(64, 36);
  changed.pixels[1000 * 4 + 1] ^= 1;
  TestValidator.predicate(
    "one channel changes the hash",
    hashAutoMovieRasterImage(changed) !== hashAutoMovieRasterImage(still),
  );
  const narrow: IAutoMovieRasterImage = picture(3, 6);
  TestValidator.predicate(
    "the shape changes the hash",
    hashAutoMovieRasterImage({ width: 6, height: 3, pixels: narrow.pixels }) !==
      hashAutoMovieRasterImage(narrow),
  );
}
