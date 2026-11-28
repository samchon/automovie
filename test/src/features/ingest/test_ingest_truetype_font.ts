import { AutoMovieIngestFont } from "@automovie/ingest";
import type {
  AutoMovieVector2Tuple,
  IAutoMovieFont,
  IAutoMovieFontGlyph,
  IAutoMovieFontSegment,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";
import { syntheticTrueTypeFont } from "../internal/syntheticTrueTypeFont";

/**
 * Decoding a TrueType font reads back the outlines, advances, metrics, kerning
 * and names it was written with.
 *
 * The font is written in code by `syntheticTrueTypeFont`, so every expected
 * value is a number the test wrote, not one the decoder produced.
 *
 * Scenarios:
 *
 * 1. Units per em, ascender, descender, line gap, `fsType` and the three names
 *    read back exactly.
 * 2. The advances of space, `L` and `O` read back exactly, and the L–O kerning
 *    pair is −50 by code point.
 * 3. `L` is one contour of six straight segments through the written points, each
 *    control at its segment's midpoint.
 * 4. `O` has two contours of opposite winding enclosing exactly 350 000 and 100
 *    000 units², the areas of its off-curve corner arcs.
 * 5. The all-off-curve dot starts at the implied midpoint of its last and first
 *    points.
 * 6. The composite `Ö` equals `O` and the dot under the written offsets and
 *    transforms, `(0.5x + 150, y + 760)` and `(x + 0.25y + 450, y + 760)`.
 * 7. A format 12 character map decodes to the same record as format 4, and
 *    decoding the same bytes twice gives deep-equal records.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public decoder on font bytes and asserts the decoded record's fields, contours and kerning; it catches wrong field offsets, a misread flag or delta, a lost implied on-curve point, a wrong composite transform or a kerning pair left by glyph index.
 * @evidence contracts/development/testing.md#independent-expectations Expected values are the numbers written into the font, and the O areas come from the closed form of a quadratic arc, two thirds of its control triangle beyond its chord, per ISO/IEC 14496-22 quadratic outlines.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 7 numbered scenarios it runs, each naming the decoded fact it pins.
 */
export function test_ingest_truetype_font(): void {
  const font: IAutoMovieFont = AutoMovieIngestFont.decode(
    syntheticTrueTypeFont(),
  );
  const glyph: (codePoint: number) => IAutoMovieFontGlyph = (
    codePoint: number,
  ): IAutoMovieFontGlyph =>
    font.glyphs.find(
      (g: IAutoMovieFontGlyph): boolean => g.codePoint === codePoint,
    )!;

  // 1. Metrics and names.
  TestValidator.equals(
    "metrics",
    [font.unitsPerEm, font.ascender, font.descender, font.lineGap, font.fsType],
    [1000, 800, -200, 0, 8],
  );
  TestValidator.equals("names", font.names, {
    family: "Synthetic Block",
    licenseDescription: "Built in test code; no rights reserved",
    licenseUrl: "urn:automovie:synthetic-font",
  });

  // 2. Advances and kerning.
  TestValidator.equals(
    "advances",
    [0x20, 0x4c, 0x4f].map((c: number): number => glyph(c).advance),
    [250, 600, 700],
  );
  TestValidator.equals("kerning by code point", font.kerning, [
    { left: 0x4c, right: 0x4f, value: -50 },
  ]);
  TestValidator.equals(
    "mapped code points in order",
    font.glyphs.map((g: IAutoMovieFontGlyph): number => g.codePoint),
    [0x20, 0x2b, 0x2e, 0x4c, 0x4f, 0xd6],
  );

  // 3. L: six straight segments.
  const L: IAutoMovieFontSegment[][] = glyph(0x4c).contours;
  TestValidator.equals("L has one contour", L.length, 1);
  TestValidator.equals(
    "L passes through its written points",
    L[0]!.map((s: IAutoMovieFontSegment): AutoMovieVector2Tuple => s.start),
    [
      [100, 0],
      [100, 700],
      [200, 700],
      [200, 100],
      [500, 100],
      [500, 0],
    ],
  );
  TestValidator.predicate(
    "L is straight: controls at midpoints",
    L[0]!.every(
      (s: IAutoMovieFontSegment): boolean =>
        s.control[0] === (s.start[0] + s.end[0]) / 2 &&
        s.control[1] === (s.start[1] + s.end[1]) / 2,
    ),
  );

  // 4. O: outer and hole of opposite winding with exact arc areas.
  const O: IAutoMovieFontSegment[][] = glyph(0x4f).contours;
  const areas: number[] = O.map(area);
  TestValidator.equals("O has two contours", O.length, 2);
  TestValidator.predicate(
    "O's contours wind oppositely",
    Math.sign(areas[0]!) === -Math.sign(areas[1]!),
  );
  TestValidator.predicate(
    "O's areas are those of its corner arcs",
    nclose(Math.abs(areas[0]!), 350000, 1e-6) &&
      nclose(Math.abs(areas[1]!), 100000, 1e-6),
  );

  // 5. The dot starts at an implied midpoint.
  const dot: IAutoMovieFontSegment[][] = glyph(0x2e).contours;
  TestValidator.equals("dot first segment", dot[0]![0], {
    start: [50, 0],
    control: [0, 0],
    end: [0, 50],
  });
  TestValidator.equals("dot has four arcs", dot[0]!.length, 4);

  // 6. The composite equals its transformed components.
  const map: (
    f: (p: AutoMovieVector2Tuple) => AutoMovieVector2Tuple,
  ) => (c: IAutoMovieFontSegment[]) => IAutoMovieFontSegment[] =
    (f: (p: AutoMovieVector2Tuple) => AutoMovieVector2Tuple) =>
    (c: IAutoMovieFontSegment[]): IAutoMovieFontSegment[] =>
      c.map(
        (s: IAutoMovieFontSegment): IAutoMovieFontSegment => ({
          start: f(s.start),
          control: f(s.control),
          end: f(s.end),
        }),
      );
  TestValidator.equals(
    "Ö is O and two transformed dots",
    glyph(0xd6).contours,
    [
      ...O,
      ...dot.map(
        map(
          ([x, y]: AutoMovieVector2Tuple): AutoMovieVector2Tuple => [
            0.5 * x + 150,
            y + 760,
          ],
        ),
      ),
      ...dot.map(
        map(
          ([x, y]: AutoMovieVector2Tuple): AutoMovieVector2Tuple => [
            x + 0.25 * y + 450,
            y + 760,
          ],
        ),
      ),
    ],
  );

  // 7. Format 12 and repeat decoding.
  TestValidator.equals(
    "format 12 cmap decodes the same record",
    AutoMovieIngestFont.decode(syntheticTrueTypeFont({ cmapFormat: 12 })),
    font,
  );
  TestValidator.equals(
    "same bytes, same record",
    AutoMovieIngestFont.decode(syntheticTrueTypeFont()),
    font,
  );
}

/**
 * Exact signed area of a closed chain of quadratic arcs: the shoelace area of
 * its on-curve chain plus, per arc, two thirds of the signed triangle its
 * control makes with the chord.
 */
function area(contour: IAutoMovieFontSegment[]): number {
  let total: number = 0;
  for (const { start, control, end } of contour) {
    total += (start[0] * end[1] - end[0] * start[1]) / 2;
    total +=
      ((2 / 3) *
        ((control[0] - start[0]) * (end[1] - start[1]) -
          (control[1] - start[1]) * (end[0] - start[0]))) /
      2;
  }
  return total;
}
