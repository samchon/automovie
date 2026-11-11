import type { IAutoMovieRasterImage } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { compareCaptureStill } from "../../../src/executable/compareCaptureStill";

/**
 * Pin what comparing one still against its earlier round reports.
 *
 * Scenarios:
 * 1. An unchanged still has an entry with no changed pixel and no box, and gets no difference image.
 * 2. A still with one changed pixel reports the count, its share of the picture, the difference and the pixel's box, and gets a difference image named `diff-<still>` of the still's size with that pixel in magenta.
 * 3. A difference equal to the tolerance counts as unchanged and still reports its size; a tolerance one below it counts the pixel as changed.
 * 4. A pair of different sizes is refused, naming the still.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment lists the four scenarios and what each pins.
 * @evidence contracts/development/testing.md#behavioral-verification Calls compareCaptureStill and asserts the whole entry, the difference image's name, size and marked pixel, and the refusal's text; a difference image made for an unchanged still, a lost one for a changed still, a wrong name, a tolerance applied one byte off or a refusal that does not say which still fails.
 * @evidence contracts/development/testing.md#independent-expectations The pictures are four pixels with one channel of one pixel moved by ten bytes, so the count, the quarter share, the ten byte difference and the box are read off the literal; magenta is the viewer's documented mark.
 * @evidence contracts/development/testing.md#distinguishing-cases An unchanged pair, a changed pair, the tolerance at and one below the difference, and a pair of two sizes; how every pixel of a difference image is coloured belongs to the installed viewer.
 * @evidence contracts/development/testing.md#execution-ownership A pure unit test with pictures built in memory, discovered by test/index.ts as an exported test_ function.
 */
export function test_compare_capture_still(): void {
  // A grey picture; `moved` raises the red channel of the pixel at column 1, row 0 by ten bytes.
  const picture = (
    width: number,
    height: number,
    moved: boolean = false,
  ): IAutoMovieRasterImage => {
    const pixels: Uint8ClampedArray = new Uint8ClampedArray(
      width * height * 4,
    ).fill(100);
    for (let offset: number = 3; offset < pixels.length; offset += 4)
      pixels[offset] = 255;
    if (moved) pixels[4] = 110;
    return { width, height, pixels };
  };
  const compare = (
    later: IAutoMovieRasterImage,
    tolerance: number = 0,
  ): ReturnType<typeof compareCaptureStill> =>
    compareCaptureStill({
      frame: "t000.200-front.png",
      earlier: picture(2, 2),
      later,
      tolerance,
    });

  // 1. Unchanged.
  const same: ReturnType<typeof compareCaptureStill> = compare(picture(2, 2));
  TestValidator.equals("an unchanged still's entry", same.entry, {
    frame: "t000.200-front.png",
    changed: 0,
    ratio: 0,
    maximum: 0,
    bounds: null,
  });
  TestValidator.predicate(
    "an unchanged still has no difference image",
    same.difference === undefined,
  );

  // 2. One changed pixel of four.
  const changed: ReturnType<typeof compareCaptureStill> = compare(
    picture(2, 2, true),
  );
  TestValidator.equals("a changed still's entry", changed.entry, {
    frame: "t000.200-front.png",
    changed: 1,
    ratio: 0.25,
    maximum: 10,
    bounds: { left: 1, top: 0, right: 1, bottom: 0 },
  });
  TestValidator.equals(
    "its difference image",
    {
      file: changed.difference?.file,
      size: [changed.difference?.image.width, changed.difference?.image.height],
      marked: [...(changed.difference?.image.pixels.subarray(4, 8) ?? [])],
    },
    {
      file: "diff-t000.200-front.png",
      size: [2, 2],
      marked: [255, 0, 255, 255],
    },
  );

  // 3. The tolerance is the largest difference that still counts as unchanged.
  const tolerated: ReturnType<typeof compareCaptureStill> = compare(
    picture(2, 2, true),
    10,
  );
  TestValidator.equals(
    "a difference at the tolerance",
    [
      tolerated.entry.changed,
      tolerated.entry.maximum,
      tolerated.difference === undefined,
    ],
    [0, 10, true],
  );
  TestValidator.equals(
    "a difference one above the tolerance",
    compare(picture(2, 2, true), 9).entry.changed,
    1,
  );

  // 4. Two rasters.
  let refusal: string = "";
  try {
    compare(picture(2, 1));
  } catch (error) {
    refusal = error instanceof Error ? error.message : String(error);
  }
  TestValidator.predicate(
    "a pair of two sizes is refused by the still's name",
    refusal.includes("t000.200-front.png"),
  );
}
