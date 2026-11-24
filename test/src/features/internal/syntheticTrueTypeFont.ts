/**
 * Write a minimal TrueType font in code, so font tests commit no font file.
 *
 * The font has units per em 1000, ascender 800, descender −200 and line gap 0,
 * and these glyphs: 0 `.notdef` (empty); 1 U+0020 space, advance 250, no
 * outline; 2 U+004C `L`, advance 600, one clockwise on-curve contour of area
 * 100 000 units²; 3 U+004F `O`, advance 700, an outer contour and a hole drawn
 * with off-curve corners, whose exact areas are 350 000 and 100 000 units²; 4
 * U+002E `.`, advance 200, one contour of four off-curve points; 5 U+00D6 `Ö`,
 * advance 700, a composite of `O` at the origin, the dot scaled by (0.5, 1) at
 * (150, 760), and the dot under the 2 × 2 transform [1, 0, 0.25, 1] at (450,
 * 760); 6 U+002B `+`, advance 600, two crossing bars. A `kern` table gives L–O
 * −50, `OS/2` gives `fsType` 8, and `name` gives family, licence description
 * and licence URL. Offsets in `loca` are long.
 *
 * Options bend one fact each for refusal tests: `cmapFormat` writes the
 * character map as format 4 or format 12; `omit` leaves a table out;
 * `locaPastGlyf` writes the last `loca` offset one byte past the end of `glyf`;
 * `selfComponent` makes `Ö` cite itself as a component.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States every glyph, metric and table the font carries and what each option changes.
 * @evidence contracts/development/implementation.md#principled-implementation Writes the tables in the field order and sizes of ISO/IEC 14496-22, big-endian, with 4-byte aligned table offsets and a sorted table directory.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One writer per table, assembled by one directory writer.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Coordinates are written as the format's flag-compressed deltas, so the decoder's flag, repeat and delta paths are exercised rather than bypassed.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the handful of glyphs and tables.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call writes fresh bytes for its own options.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one owned byte array and retains nothing.
 */
export function syntheticTrueTypeFont(
  options: {
    cmapFormat?: 4 | 12;
    omit?: string;
    locaPastGlyf?: boolean;
    selfComponent?: boolean;
  } = {},
): Uint8Array {
  type Point = { x: number; y: number; on: boolean };
  const on: (x: number, y: number) => Point = (
    x: number,
    y: number,
  ): Point => ({
    x,
    y,
    on: true,
  });
  const off: (x: number, y: number) => Point = (
    x: number,
    y: number,
  ): Point => ({ x, y, on: false });

  const glyphs: number[][] = [
    [],
    [],
    simple([
      [
        on(100, 0),
        on(100, 700),
        on(200, 700),
        on(200, 100),
        on(500, 100),
        on(500, 0),
      ],
    ]),
    simple([
      [
        on(350, 0),
        off(50, 0),
        on(50, 350),
        off(50, 700),
        on(350, 700),
        off(650, 700),
        on(650, 350),
        off(650, 0),
      ],
      [
        on(350, 150),
        off(500, 150),
        on(500, 350),
        off(500, 550),
        on(350, 550),
        off(200, 550),
        on(200, 350),
        off(200, 150),
      ],
    ]),
    simple([[off(0, 0), off(0, 100), off(100, 100), off(100, 0)]]),
    composite(options.selfComponent === true),
    simple([
      [on(250, 0), on(250, 600), on(350, 600), on(350, 0)],
      [on(0, 250), on(0, 350), on(600, 350), on(600, 250)],
    ]),
  ];
  const advances: number[] = [500, 250, 600, 700, 200, 700, 600];
  const mapping: [number, number][] = [
    [0x20, 1],
    [0x2b, 6],
    [0x2e, 4],
    [0x4c, 2],
    [0x4f, 3],
    [0xd6, 5],
  ];

  // glyf and its long loca offsets, each glyph padded to an even length.
  const glyf: number[] = [];
  const loca: number[] = [];
  for (const glyph of glyphs) {
    loca.push(glyf.length);
    glyf.push(...glyph);
    if (glyf.length % 2 === 1) glyf.push(0);
  }
  loca.push(glyf.length + (options.locaPastGlyf === true ? 1 : 0));

  const tables: Record<string, number[]> = {
    head: [
      ...u32(0x00010000),
      ...u32(0x00010000),
      ...u32(0),
      ...u32(0x5f0f3cf5),
      ...u16(0),
      ...u16(1000),
      ...new Array<number>(16).fill(0),
      ...i16(0),
      ...i16(-200),
      ...i16(700),
      ...i16(800),
      ...u16(0),
      ...u16(8),
      ...i16(2),
      ...i16(1),
      ...i16(0),
    ],
    hhea: [
      ...u32(0x00010000),
      ...i16(800),
      ...i16(-200),
      ...i16(0),
      ...u16(700),
      ...new Array<number>(22).fill(0),
      ...u16(glyphs.length),
    ],
    maxp: [...u32(0x00005000), ...u16(glyphs.length)],
    cmap: options.cmapFormat === 12 ? cmap12(mapping) : cmap4(mapping),
    hmtx: advances.flatMap((advance: number): number[] => [
      ...u16(advance),
      ...i16(0),
    ]),
    loca: loca.flatMap(u32),
    glyf,
    kern: [
      ...u16(0),
      ...u16(1),
      ...u16(0),
      ...u16(20),
      ...u16(0x0001),
      ...u16(1),
      ...u16(6),
      ...u16(0),
      ...u16(0),
      ...u16(2),
      ...u16(3),
      ...i16(-50),
    ],
    "OS/2": [
      ...u16(0),
      ...new Array<number>(6).fill(0),
      ...u16(8),
      ...new Array<number>(68).fill(0),
    ],
    name: names([
      [1, "Synthetic Block"],
      [13, "Built in test code; no rights reserved"],
      [14, "urn:automovie:synthetic-font"],
    ]),
  };
  if (options.omit !== undefined) delete tables[options.omit];

  // Directory sorted by tag, tables 4-byte aligned after it.
  const tags: string[] = Object.keys(tables).sort(
    (left: string, right: string): number =>
      left < right ? -1 : left > right ? 1 : 0,
  );
  const header: number = 12 + tags.length * 16;
  const body: number[] = [];
  const records: number[] = [];
  for (const tag of tags) {
    const data: number[] = tables[tag]!;
    records.push(
      ...[...tag].map((c: string): number => c.charCodeAt(0)),
      ...u32(0),
      ...u32(header + body.length),
      ...u32(data.length),
    );
    body.push(...data);
    while (body.length % 4 !== 0) body.push(0);
  }
  let power: number = 1;
  while (power * 2 <= tags.length) power *= 2;
  return Uint8Array.from([
    ...u32(0x00010000),
    ...u16(tags.length),
    ...u16(power * 16),
    ...u16(Math.log2(power)),
    ...u16(tags.length * 16 - power * 16),
    ...records,
    ...body,
  ]);

  /** A simple glyph with flag-compressed delta coordinates. */
  function simple(contours: Point[][]): number[] {
    const points: Point[] = contours.flat();
    const xs: number[] = points.map((p: Point): number => p.x);
    const ys: number[] = points.map((p: Point): number => p.y);
    const out: number[] = [
      ...i16(contours.length),
      ...i16(Math.min(...xs)),
      ...i16(Math.min(...ys)),
      ...i16(Math.max(...xs)),
      ...i16(Math.max(...ys)),
    ];
    let end: number = -1;
    for (const contour of contours) {
      end += contour.length;
      out.push(...u16(end));
    }
    out.push(...u16(0));
    const flags: number[] = [];
    const xBytes: number[] = [];
    const yBytes: number[] = [];
    let px: number = 0;
    let py: number = 0;
    for (const point of points) {
      let flag: number = point.on ? 1 : 0;
      const dx: number = point.x - px;
      const dy: number = point.y - py;
      if (dx === 0) flag |= 0x10;
      else if (Math.abs(dx) < 256) {
        flag |= 0x02 | (dx > 0 ? 0x10 : 0);
        xBytes.push(Math.abs(dx));
      } else xBytes.push(...i16(dx));
      if (dy === 0) flag |= 0x20;
      else if (Math.abs(dy) < 256) {
        flag |= 0x04 | (dy > 0 ? 0x20 : 0);
        yBytes.push(Math.abs(dy));
      } else yBytes.push(...i16(dy));
      flags.push(flag);
      px = point.x;
      py = point.y;
    }
    for (let at: number = 0; at < flags.length; ) {
      let run: number = 1;
      while (
        at + run < flags.length &&
        flags[at + run] === flags[at] &&
        run < 255
      )
        ++run;
      if (run > 1) out.push(flags[at]! | 0x08, run - 1);
      else out.push(flags[at]!);
      at += run;
    }
    out.push(...xBytes, ...yBytes);
    return out;
  }

  /** `Ö`: the `O` and two transformed dots, or a component citing itself. */
  function composite(self: boolean): number[] {
    const words: number = 0x0001 | 0x0002;
    return [
      ...i16(-1),
      ...i16(50),
      ...i16(0),
      ...i16(650),
      ...i16(860),
      ...u16(words | 0x0020),
      ...u16(self ? 5 : 3),
      ...i16(0),
      ...i16(0),
      ...u16(words | 0x0020 | 0x0040),
      ...u16(4),
      ...i16(150),
      ...i16(760),
      ...i16(0.5 * 16384),
      ...i16(16384),
      ...u16(words | 0x0080),
      ...u16(4),
      ...i16(450),
      ...i16(760),
      ...i16(16384),
      ...i16(0),
      ...i16(0.25 * 16384),
      ...i16(16384),
    ];
  }

  /**
   * A format 4 subtable with one segment per code point and the closing 0xFFFF
   * segment.
   */
  function cmap4(pairs: [number, number][]): number[] {
    const segments: [number, number, number][] = [
      ...pairs.map(([c, g]: [number, number]): [number, number, number] => [
        c,
        c,
        (g - c) & 0xffff,
      ]),
      [0xffff, 0xffff, 1],
    ];
    const count: number = segments.length;
    const sub: number[] = [
      ...u16(4),
      ...u16(16 + count * 8),
      ...u16(0),
      ...u16(count * 2),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...segments.flatMap((s: [number, number, number]): number[] => u16(s[1])),
      ...u16(0),
      ...segments.flatMap((s: [number, number, number]): number[] => u16(s[0])),
      ...segments.flatMap((s: [number, number, number]): number[] => u16(s[2])),
      ...segments.flatMap((): number[] => u16(0)),
    ];
    return [...u16(0), ...u16(1), ...u16(3), ...u16(1), ...u32(12), ...sub];
  }

  /** A format 12 subtable with one group per code point. */
  function cmap12(pairs: [number, number][]): number[] {
    const sub: number[] = [
      ...u16(12),
      ...u16(0),
      ...u32(16 + pairs.length * 12),
      ...u32(0),
      ...u32(pairs.length),
      ...pairs.flatMap(([c, g]: [number, number]): number[] => [
        ...u32(c),
        ...u32(c),
        ...u32(g),
      ]),
    ];
    return [...u16(0), ...u16(1), ...u16(3), ...u16(10), ...u32(12), ...sub];
  }

  /** A format 0 `name` table of Windows US English UTF-16BE records. */
  function names(entries: [number, string][]): number[] {
    const strings: number[] = [];
    const records: number[] = [];
    for (const [id, text] of entries) {
      const encoded: number[] = [...text].flatMap((c: string): number[] =>
        u16(c.charCodeAt(0)),
      );
      records.push(
        ...u16(3),
        ...u16(1),
        ...u16(0x0409),
        ...u16(id),
        ...u16(encoded.length),
        ...u16(strings.length),
      );
      strings.push(...encoded);
    }
    return [
      ...u16(0),
      ...u16(entries.length),
      ...u16(6 + records.length),
      ...records,
      ...strings,
    ];
  }

  /** Big-endian unsigned 16-bit bytes. */
  function u16(value: number): number[] {
    return [(value >> 8) & 0xff, value & 0xff];
  }

  /** Big-endian signed 16-bit bytes. */
  function i16(value: number): number[] {
    return u16(value & 0xffff);
  }

  /** Big-endian unsigned 32-bit bytes. */
  function u32(value: number): number[] {
    return [
      (value >>> 24) & 0xff,
      (value >>> 16) & 0xff,
      (value >>> 8) & 0xff,
      value & 0xff,
    ];
  }
}
