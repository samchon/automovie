import { AutoMovieEngineTypography } from "@automovie/engine";
import { AutoMovieIngestFont } from "@automovie/ingest";
import type {
  IAutoMovieFont,
  IAutoMovieLayoutText,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";
import { syntheticTrueTypeFont } from "../internal/syntheticTrueTypeFont";

/**
 * Text layout advances glyphs by advance plus kerning, wraps at spaces, stacks
 * lines from one ascender below the box top, and refuses what it cannot set.
 *
 * The font has units per em 1000, ascender 800, descender −200, line gap 0, `L`
 * advancing 600, `O` 700, space 250 and an L–O kerning pair of −50.
 *
 * Scenarios:
 *
 * 1. "LO" at 0.1 m is (600 − 50 + 700) × 0.1 / 1000 = 0.125 m wide: `O` starts at
 *    0.055 m, and the first baseline is 0.2 − 0.08 = 0.12 m in a 0.2 m box.
 * 2. Aligned to the end of a 0.13 m box `L` starts at 0.005 m, and centred at
 *    0.0025 m.
 * 3. A 0.12 m box refuses "LO" as a word wider than the box; 0.13 m admits it.
 * 4. A code point the font does not map is refused, naming `U+005A`.
 * 5. "L L" (0.145 m) in a 0.1 m box wraps at its space into two lines whose
 *    baselines are 0.1 m apart; a 0.2 m box holds them exactly and a 0.19 m box
 *    refuses them as overflowing its height.
 * 6. `\n` breaks a line, and a line height of 1.5 spaces the baselines 0.15 m
 *    apart.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public layout and asserts glyph positions, line widths, baselines and refusals; it catches a dropped kerning pair, a baseline at the box top, a wrap at the wrong place and a substituted glyph.
 * @evidence contracts/development/testing.md#independent-expectations Every expected length is computed by hand from the font's written metrics and #4098's layout rules, as the scenarios show.
 * @evidence contracts/development/common.md#meaningful-documentation Kerning and alignment place glyphs at hand-derived offsets. An overwide word, a missing glyph, a wrapped space and an explicit line break exercise the layout decisions.
 */
export function test_engine_text_layout(): void {
  const font: IAutoMovieFont = AutoMovieIngestFont.decode(
    syntheticTrueTypeFont(),
  );
  const lay: (
    text: string,
    width: number,
    height: number,
    extra?: Partial<IAutoMovieLayoutText.IProps>,
  ) => IAutoMovieLayoutText.IResult = (
    text: string,
    width: number,
    height: number,
    extra: Partial<IAutoMovieLayoutText.IProps> = {},
  ): IAutoMovieLayoutText.IResult =>
    AutoMovieEngineTypography.layoutText({
      font,
      text,
      size: 0.1,
      box: { width, height },
      ...extra,
    });

  // 1. Width, kerning and the first baseline.
  const lo: IAutoMovieLayoutText.IResult = lay("LO", 0.13, 0.2);
  TestValidator.predicate(
    "LO is 0.125 m wide",
    nclose(lo.lines[0]!.width, 0.125, 1e-12),
  );
  TestValidator.predicate(
    "O starts after L's kerned advance",
    nclose(lo.glyphs[0]!.x, 0, 1e-12) && nclose(lo.glyphs[1]!.x, 0.055, 1e-12),
  );
  TestValidator.predicate(
    "first baseline one ascender below the top",
    nclose(lo.lines[0]!.baseline, 0.12, 1e-12) &&
      nclose(lo.glyphs[1]!.y, 0.12, 1e-12),
  );

  // 2. Alignment.
  TestValidator.predicate(
    "end alignment",
    nclose(lay("LO", 0.13, 0.2, { align: "end" }).glyphs[0]!.x, 0.005, 1e-12),
  );
  TestValidator.predicate(
    "centre alignment",
    nclose(
      lay("LO", 0.13, 0.2, { align: "center" }).glyphs[0]!.x,
      0.0025,
      1e-12,
    ),
  );

  // 3. A word wider than the box.
  TestValidator.predicate(
    "a 0.12 m box refuses LO",
    throwsError((): unknown => lay("LO", 0.12, 0.2), "wider than the"),
  );

  // 4. An unmapped code point.
  TestValidator.predicate(
    "an unmapped code point is named",
    throwsError((): unknown => lay("LZ", 1, 1), "U+005A"),
  );

  // 5. Wrapping and the height limit.
  const wrapped: IAutoMovieLayoutText.IResult = lay("L L", 0.1, 0.2);
  TestValidator.equals(
    "wraps at the space",
    wrapped.glyphs.map((g: IAutoMovieLayoutText.IGlyph): [number, number] => [
      g.codePoint,
      g.line,
    ]),
    [
      [0x4c, 0],
      [0x4c, 1],
    ],
  );
  TestValidator.predicate(
    "baselines one line apart",
    nclose(wrapped.lines[0]!.baseline - wrapped.lines[1]!.baseline, 0.1, 1e-12),
  );
  TestValidator.predicate(
    "a 0.19 m box overflows",
    throwsError((): unknown => lay("L L", 0.1, 0.19), "overflow"),
  );

  // 6. Line breaks and line height.
  const spaced: IAutoMovieLayoutText.IResult = lay("L\nO", 1, 1, {
    lineHeight: 1.5,
  });
  TestValidator.equals("newline breaks", spaced.lines.length, 2);
  TestValidator.predicate(
    "line height 1.5",
    nclose(spaced.lines[0]!.baseline - spaced.lines[1]!.baseline, 0.15, 1e-12),
  );
}
