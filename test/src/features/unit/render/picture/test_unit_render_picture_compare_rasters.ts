import type {
  IAutoMovieRasterComparison,
  IAutoMovieRasterImage,
} from "@automovie/interface";
import { compareAutoMovieRasters } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * Comparing two pictures of the same size counts the pixels that changed, boxes
 * them, reports the largest difference, and draws a difference picture with the
 * changed pixels in magenta over the newer picture dimmed to grey.
 *
 * Scenarios:
 *
 * 1. Two identical 4 by 3 pictures report no change, no box and a zero maximum,
 *    and the difference picture is the dimmed grey of each pixel, opaque.
 * 2. Two pictures that differ at (1,0) and (2,2) report two changed pixels, their
 *    share of twelve, the largest channel difference, the box around both, and
 *    magenta at exactly those pixels.
 * 3. A difference of 3 is unchanged under a tolerance of 3 and changed under a
 *    tolerance of 2, the maximum is reported either way, and an unchanged pixel
 *    is dimmed from the newer picture.
 * 4. Pictures of different sizes, a picture whose pixels do not match its size,
 *    and a negative tolerance are refused.
 */
export function test_unit_render_picture_compare_rasters(): void {
  const picture = (
    width: number,
    height: number,
    fill: readonly [number, number, number],
  ): IAutoMovieRasterImage => {
    const pixels: Uint8ClampedArray = new Uint8ClampedArray(width * height * 4);
    for (let i: number = 0; i < width * height; i++)
      pixels.set([fill[0], fill[1], fill[2], 255], i * 4);
    return { width, height, pixels };
  };
  const paint = (
    image: IAutoMovieRasterImage,
    x: number,
    y: number,
    rgb: readonly [number, number, number],
  ): IAutoMovieRasterImage => {
    image.pixels.set(rgb, (y * image.width + x) * 4);
    return image;
  };
  const at = (image: IAutoMovieRasterImage, x: number, y: number): number[] =>
    Array.from(
      image.pixels.subarray(
        (y * image.width + x) * 4,
        (y * image.width + x) * 4 + 4,
      ),
    );

  // 1. Identical pictures.
  const same: IAutoMovieRasterComparison = compareAutoMovieRasters(
    paint(picture(4, 3, [200, 200, 200]), 3, 2, [255, 0, 0]),
    paint(picture(4, 3, [200, 200, 200]), 3, 2, [255, 0, 0]),
  );
  TestValidator.equals(
    "identical pictures report no change",
    [same.changed, same.ratio, same.maximum, same.bounds],
    [0, 0, 0, null],
  );
  TestValidator.equals(
    "the difference picture has the compared size",
    [same.image.width, same.image.height, same.image.pixels.length],
    [4, 3, 48],
  );
  TestValidator.equals(
    "an unchanged light grey is dimmed to half",
    at(same.image, 0, 0),
    [100, 100, 100, 255],
  );
  TestValidator.equals(
    "an unchanged red is dimmed to half its luma",
    at(same.image, 3, 2),
    [27, 27, 27, 255],
  );

  // 2. Changed pixels.
  const before: IAutoMovieRasterImage = picture(4, 3, [200, 200, 200]);
  const after: IAutoMovieRasterImage = paint(
    paint(picture(4, 3, [200, 200, 200]), 1, 0, [200, 150, 200]),
    2,
    2,
    [0, 200, 210],
  );
  const changed: IAutoMovieRasterComparison = compareAutoMovieRasters(
    before,
    after,
  );
  TestValidator.equals("two pixels changed", changed.changed, 2);
  TestValidator.equals("their share of twelve", changed.ratio, 2 / 12);
  TestValidator.equals("the largest difference", changed.maximum, 200);
  TestValidator.equals("the box around both", changed.bounds, {
    left: 1,
    top: 0,
    right: 2,
    bottom: 2,
  });
  TestValidator.equals(
    "the first changed pixel is magenta",
    at(changed.image, 1, 0),
    [255, 0, 255, 255],
  );
  TestValidator.equals(
    "the second changed pixel is magenta",
    at(changed.image, 2, 2),
    [255, 0, 255, 255],
  );
  TestValidator.equals(
    "a pixel between them is dimmed, not marked",
    at(changed.image, 2, 1),
    [100, 100, 100, 255],
  );
  TestValidator.equals(
    "the compared pictures are not written",
    [at(before, 1, 0), at(after, 1, 0)],
    [
      [200, 200, 200, 255],
      [200, 150, 200, 255],
    ],
  );

  // 3. Tolerance.
  const dim: IAutoMovieRasterImage = picture(2, 1, [10, 10, 10]);
  const nudged: IAutoMovieRasterImage = paint(
    picture(2, 1, [10, 10, 10]),
    1,
    0,
    [10, 13, 10],
  );
  const tolerated: IAutoMovieRasterComparison = compareAutoMovieRasters(
    dim,
    nudged,
    3,
  );
  TestValidator.equals(
    "a difference at the tolerance is unchanged, and still the maximum",
    [tolerated.changed, tolerated.maximum, tolerated.bounds],
    [0, 3, null],
  );
  const strict: IAutoMovieRasterComparison = compareAutoMovieRasters(
    dim,
    nudged,
    2,
  );
  TestValidator.equals(
    "a difference above the tolerance is changed",
    [strict.changed, strict.ratio, strict.maximum, strict.bounds],
    [1, 0.5, 3, { left: 1, top: 0, right: 1, bottom: 0 }],
  );
  const newer: IAutoMovieRasterComparison = compareAutoMovieRasters(
    picture(1, 1, [100, 100, 100]),
    picture(1, 1, [140, 140, 140]),
    50,
  );
  TestValidator.equals(
    "an unchanged pixel is dimmed from the newer picture",
    [newer.changed, newer.maximum, at(newer.image, 0, 0)],
    [0, 40, [70, 70, 70, 255]],
  );

  // 4. Refusals.
  TestValidator.error("pictures of different sizes are refused", (): void => {
    compareAutoMovieRasters(picture(4, 3, [0, 0, 0]), picture(3, 4, [0, 0, 0]));
  });
  TestValidator.error(
    "a picture whose pixels do not match its size is refused",
    (): void => {
      compareAutoMovieRasters(picture(2, 2, [0, 0, 0]), {
        width: 2,
        height: 2,
        pixels: new Uint8ClampedArray(12),
      });
    },
  );
  for (const tolerance of [-1])
    TestValidator.error(`a tolerance of ${tolerance} is refused`, (): void => {
      compareAutoMovieRasters(
        picture(1, 1, [0, 0, 0]),
        picture(1, 1, [0, 0, 0]),
        tolerance,
      );
    });
}
