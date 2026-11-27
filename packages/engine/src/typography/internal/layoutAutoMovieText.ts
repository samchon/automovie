import type {
  IAutoMovieFontGlyph,
  IAutoMovieFontKerning,
  IAutoMovieLayoutText,
} from "@automovie/interface";

/** Code point of the space, the only wrap opportunity. */
const SPACE: number = 0x20;

/**
 * Rounding allowance, metres, when a measured line is compared with the box:
 * far below any drawn feature, so a run that fits exactly is not refused for
 * the last bit of a product of decimal scales.
 */
const FIT: number = 1e-9;

/**
 * Lay a text run out from a decoded font into positioned glyphs in the box's
 * frame: origin at the box's bottom-left corner, `+x` right, `+y` up, metres.
 *
 * Each glyph advances by its `hmtx` advance plus the `kern` pair it forms with
 * the next glyph, scaled by `size / unitsPerEm`. `\n` ends a line; within a
 * paragraph a line that would grow wider than `box.width` breaks at its last
 * U+0020, which is dropped, and the rest continues on the next line. The first
 * baseline lies one scaled ascender below the box's top, and each next one
 * `lineHeight × (ascender − descender + lineGap)` scaled below the last. Lines
 * align to the box's left edge, centre or right edge.
 *
 * Refused, each with its own diagnostic: a code point the font does not map,
 * named as `U+XXXX`, never substituted; a word wider than the box; lines whose
 * last descender falls below the box's bottom; and a nonpositive or non-finite
 * size, box edge or line height. A comparison with the box allows 1 nm for
 * rounding.
 *
 * Cost is linear in the text's code points, after one map of the font's glyphs
 * and kerning pairs, plus a re-measure of the carried word after each break.
 *
 * @throws {Error} Any refusal above.
 */
export function layoutAutoMovieText(
  props: IAutoMovieLayoutText.IProps,
): IAutoMovieLayoutText.IResult {
  const { font, box }: IAutoMovieLayoutText.IProps = props;
  const lineHeight: number = props.lineHeight ?? 1;
  const align: "start" | "center" | "end" = props.align ?? "start";
  for (const [label, value] of [
    ["text size", props.size],
    ["box width", box.width],
    ["box height", box.height],
    ["line height", lineHeight],
  ] as const)
    if (value <= 0)
      throw new Error(
        `Text ${label} must be finite and positive, not ${value}`,
      );
  if (align !== "start" && align !== "center" && align !== "end")
    throw new Error(
      `Text align must be start, center or end, not ${String(align)}`,
    );
  const scale: number = props.size / font.unitsPerEm;

  const glyphs: Map<number, IAutoMovieFontGlyph> = new Map(
    font.glyphs.map(
      (glyph: IAutoMovieFontGlyph): [number, IAutoMovieFontGlyph] => [
        glyph.codePoint,
        glyph,
      ],
    ),
  );
  const kerning: Map<string, number> = new Map(
    font.kerning.map((pair: IAutoMovieFontKerning): [string, number] => [
      `${pair.left},${pair.right}`,
      pair.value,
    ]),
  );
  const advance: (glyph: number) => number = (glyph: number): number =>
    glyphs.get(glyph)!.advance;
  const kern: (left: number, right: number) => number = (
    left: number,
    right: number,
  ): number => kerning.get(`${left},${right}`) ?? 0;

  // Every code point must be drawable before anything is set.
  const paragraphs: number[][] = props.text
    .split("\n")
    .map((paragraph: string): number[] =>
      [...paragraph].map((character: string): number => {
        const codePoint: number = character.codePointAt(0)!;
        if (!glyphs.has(codePoint))
          throw new Error(
            `The font maps no glyph to ${name(codePoint)}; it is never substituted`,
          );
        return codePoint;
      }),
    );

  // Width in metres of a run of code points, kerning between neighbours.
  const width: (run: readonly number[]) => number = (
    run: readonly number[],
  ): number => {
    let units: number = 0;
    for (let at: number = 0; at < run.length; ++at)
      units +=
        advance(run[at]!) +
        (at + 1 < run.length ? kern(run[at]!, run[at + 1]!) : 0);
    return units * scale;
  };

  // Greedy wrap: break before the character that overflows, at the last space.
  const lines: number[][] = [];
  for (const paragraph of paragraphs) {
    let line: number[] = [];
    let measured: number = 0;
    for (const codePoint of paragraph) {
      measured +=
        (line.length > 0
          ? kern(line[line.length - 1]!, codePoint) * scale
          : 0) +
        advance(codePoint) * scale;
      line.push(codePoint);
      if (measured <= box.width + FIT) continue;
      const space: number = line.lastIndexOf(SPACE);
      if (space < 0)
        throw new Error(
          `The word "${String.fromCodePoint(...line)}" is wider than the ${box.width} m box`,
        );
      lines.push(line.slice(0, space));
      line = line.slice(space + 1);
      measured = width(line);
      if (measured > box.width + FIT)
        throw new Error(
          `The word "${String.fromCodePoint(...line)}" is wider than the ${box.width} m box`,
        );
    }
    lines.push(line);
  }

  const pitch: number =
    lineHeight * (font.ascender - font.descender + font.lineGap) * scale;
  const first: number = box.height - font.ascender * scale;
  const bottom: number =
    first - (lines.length - 1) * pitch + font.descender * scale;
  if (bottom < -FIT)
    throw new Error(
      `The text's ${lines.length} lines need ${box.height - bottom} m and overflow the ${box.height} m box height`,
    );

  const placed: IAutoMovieLayoutText.IGlyph[] = [];
  const set: IAutoMovieLayoutText.ILine[] = lines.map(
    (line: number[], index: number): IAutoMovieLayoutText.ILine => {
      const lineWidth: number = width(line);
      const baseline: number = first - index * pitch;
      let x: number =
        align === "start"
          ? 0
          : align === "center"
            ? (box.width - lineWidth) / 2
            : box.width - lineWidth;
      line.forEach((codePoint: number, at: number): void => {
        placed.push({ codePoint, x, y: baseline, line: index });
        x +=
          (advance(codePoint) +
            (at + 1 < line.length ? kern(codePoint, line[at + 1]!) : 0)) *
          scale;
      });
      return { width: lineWidth, baseline };
    },
  );
  return { glyphs: placed, lines: set, scale };
}

/** A code point as `U+XXXX` with the character beside it. */
function name(codePoint: number): string {
  return `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")} "${String.fromCodePoint(codePoint)}"`;
}
