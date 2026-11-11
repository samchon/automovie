import { AutoMovieRasterSheet, type IAutoMovieRasterImage } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * A sheet caption longer than its cell wraps onto further lines at word boundaries instead of being cut, so it keeps every word that identifies the cell, and the strip under the cell holds the lines its sheet was made for.
 *
 * Scenarios:
 *
 * 1. Under a 40 px wide, 12 px tall cell, where the stamp fits 9 characters a line at scale 1, `f8 0.250s r toeoff1 front` wraps to `f8 0.250s`, `r toeoff1` and `front`, and a 12-character word is broken into 9 and 3 characters.
 * 2. A caption that fits is one line, and an empty caption one empty line.
 * 3. `AutoMovieRasterSheet.lines` is the most lines any caption takes, at least one, and `caption` grows a strip by six font pixels a line: 9, 15 and 21 px for one, two and three lines at scale 1.
 * 4. A sheet made for two lines of an 8 by 12 cell is 8 by 27; adding a picture captioned with two lines writes white glyph pixels in the second line's rows, and a caption of three lines keeps its first two.
 * 5. A sheet asked for zero lines is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Wraps captions and fills real sheets through the public statics and constructor, then reads the lines and the strip's pixels; a wrapper that cut a word, a strip that kept one line, or a sheet that ignored its line count fails.
 * @evidence contracts/development/testing.md#independent-expectations Characters per line follow from the stamp's documented box, four font pixels a character less one plus two of margin each side, worked by hand; strip heights from five glyph rows, one row between lines and two of margin; the glyph rows of `1` are the documented 3 by 5 font's.
 * @evidence contracts/development/testing.md#distinguishing-cases A caption that wraps, one that fits, an empty one, an overlong word, a caption longer than the strip, and a refused line count. Reserving the strip in a layout is owned by `test_capture_layout_budget`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_picture_caption_wrap`; pictures are in memory.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_picture_caption_wrap(): void {
  // 1. Wrapping at words, and breaking a long word.
  TestValidator.equals(
    "words wrap at the cell's width",
    AutoMovieRasterSheet.wrap("f8 0.250s r toeoff1 front", 40, 12),
    ["f8 0.250s", "r toeoff1", "front"],
  );
  TestValidator.equals(
    "a word longer than a line is broken",
    AutoMovieRasterSheet.wrap("abcdefghijkl", 40, 12),
    ["abcdefghi", "jkl"],
  );

  // 2. Short and empty captions.
  TestValidator.equals("a caption that fits is one line", AutoMovieRasterSheet.wrap("f8 0.25s", 40, 12), ["f8 0.25s"]);
  TestValidator.equals("an empty caption is one empty line", AutoMovieRasterSheet.wrap("", 40, 12), [""]);

  // 3. Lines and strip heights.
  TestValidator.equals(
    "the most lines of any caption",
    [AutoMovieRasterSheet.lines([], 40, 12), AutoMovieRasterSheet.lines(["a", "f8 0.250s r toeoff1 front"], 40, 12)],
    [1, 3],
  );
  TestValidator.equals(
    "a strip grows six font pixels a line",
    [1, 2, 3].map((lines: number): number => AutoMovieRasterSheet.caption(12, lines)),
    [9, 15, 21],
  );

  // 4. A two-line sheet.
  const picture: IAutoMovieRasterImage = {
    width: 8,
    height: 12,
    pixels: new Uint8ClampedArray(8 * 12 * 4).fill(100),
  };
  const two: AutoMovieRasterSheet = new AutoMovieRasterSheet(1, 1, 8, 12, "area", 2);
  two.add(picture, "1 1");
  const sheet: IAutoMovieRasterImage = two.finish();
  const red: (x: number, y: number) => number = (x: number, y: number): number => sheet.pixels[(y * 8 + x) * 4]!;
  TestValidator.equals("a two-line strip is 15 px under the 12 px cell", [sheet.width, sheet.height], [8, 27]);

  // The 8 px cell fits one character a line, so "1 1" wraps to "1" and "1"; the glyph's top row lights its middle column, two pixels into each line's box.
  TestValidator.equals(
    "both lines are stamped in the strip",
    [red(3, 12 + 2), red(3, 12 + 6 + 2), red(0, 12 + 2)],
    [255, 255, 16],
  );
  const cut: AutoMovieRasterSheet = new AutoMovieRasterSheet(1, 1, 8, 12, "area", 2);
  cut.add(picture, "1 1 1");
  TestValidator.equals("a caption longer than the strip keeps its first lines", cut.finish().height, 27);

  // 5. Refusal.
  TestValidator.error("zero lines are refused", (): unknown => new AutoMovieRasterSheet(1, 1, 8, 12, "area", 0));
}
