import {
  type IAutoMovieRasterImage,
  stampAutoMovieRasterLabel,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * A label is burnt into a picture as a dark box `scale * (4 * length + 3)` wide and `9 * scale` high with white glyphs, at the anchor it is given and kept inside the picture.
 *
 * Scenarios:
 *
 * 1. `1` stamped at scale 2 at (10, 20) on a 64 by 64 black picture darkens the 14 by 18 box from (10, 20), whitens some pixels inside it, and leaves the pixels just outside it black.
 * 2. An anchor past the right and bottom edges moves the box back inside the picture, against those edges.
 * 3. Without an anchor the box starts at the top-left corner.
 * 4. A scale that is not a positive integer is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Stamps labels into in-memory pictures and reads the pixels at and around the documented box.
 * @evidence contracts/development/testing.md#independent-expectations The box size is computed by hand from the documented glyph metrics, the box colour is the stamp's documented dark grey and the glyphs white.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts inside against just outside the box, an anchor inside against one past the edges, an anchor against none, and valid against refused scales. Label placement belongs to `test_inspection_labels`.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit builds its own pictures and starts no browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: 1 stamped at scale 2 at (10, 20) on a 64 by 64 black picture).
 */
export function test_picture_label_stamp(): void {
  const picture = (): IAutoMovieRasterImage => {
    const pixels: Uint8ClampedArray = new Uint8ClampedArray(64 * 64 * 4);
    for (let i: number = 3; i < pixels.length; i += 4) pixels[i] = 255;
    return { width: 64, height: 64, pixels };
  };
  const at = (image: IAutoMovieRasterImage, x: number, y: number): number => image.pixels[(y * image.width + x) * 4]!;
  const box = (image: IAutoMovieRasterImage, left: number, top: number, width: number, height: number): number[] => {
    const values: number[] = [];
    for (let y: number = top; y < top + height; y++) for (let x: number = left; x < left + width; x++) values.push(at(image, x, y));
    return values;
  };

  // 1. At an anchor.
  const one: IAutoMovieRasterImage = picture();
  stampAutoMovieRasterLabel(one, "1", 2, { x: 10, y: 20 });
  const inside: number[] = box(one, 10, 20, 14, 18);
  TestValidator.predicate(
    "the box is dark with white glyphs",
    inside.every((value: number): boolean => value === 16 || value === 255) && inside.includes(16) && inside.includes(255),
  );
  TestValidator.equals(
    "just outside the box stays black",
    [at(one, 9, 20), at(one, 24, 20), at(one, 10, 19), at(one, 10, 38)],
    [0, 0, 0, 0],
  );

  // 2. Kept inside.
  const edge: IAutoMovieRasterImage = picture();
  stampAutoMovieRasterLabel(edge, "1", 2, { x: 60, y: 60 });
  TestValidator.equals("the box moves back against the edges", [at(edge, 50, 46), at(edge, 63, 63), at(edge, 49, 46)], [16, 16, 0]);

  // 3. No anchor.
  const corner: IAutoMovieRasterImage = picture();
  stampAutoMovieRasterLabel(corner, "1", 1);
  TestValidator.equals("the box starts at the corner", [at(corner, 0, 0), at(corner, 6, 8), at(corner, 7, 0)], [16, 16, 0]);

  // 4. Refusal.
  for (const scale of [0, 1.5, -1])
    TestValidator.error(`scale ${scale} is refused`, (): void => {
      stampAutoMovieRasterLabel(picture(), "1", scale);
    });
}
