import type { TrueTypeByteReader } from "./TrueTypeByteReader";

/*
 * Read a font's Unicode character map: which glyph each code point selects,
 * from the `cmap` table (ISO/IEC 14496-22, section 5.2.1).
 *
 * The Unicode encoding records are platform 0 with any encoding, and platform 3
 * with encoding 1 (BMP) or 10 (full repertoire). A format 12 subtable among
 * them is read in preference to a format 4 one, because it covers code points
 * past U+FFFF; other formats are skipped. Format 4 follows the segment arrays
 * exactly, including the `idRangeOffset` indirection and modulo-65536
 * `idDelta`. Code point U+FFFF and glyph 0 (`.notdef`) map nothing, so a code
 * point the font cannot draw is absent instead of silently drawing `.notdef`.
 * Parameter reader: Bounds-checked reader over the font bytes.
 * Parameter offset: Byte offset of the `cmap` table.
 * Parameter glyphCount: `maxp` glyph count; a mapping to a glyph at or past it
 * refuses.
 * Returns: Code point to glyph index, in increasing code point order.
 * No Unicode subtable of format 4 or 12 exists, a field lies
 * outside the bytes, or a mapping names a glyph past the glyph count or a
 * code point past U+10FFFF.
 */
export function readTrueTypeCharacterMap(
  reader: TrueTypeByteReader,
  offset: number,
  glyphCount: number,
): Map<number, number> {
  const count: number = reader.u16(offset + 2, "cmap header");
  let format4: number | null = null;
  let format12: number | null = null;
  for (let index: number = 0; index < count; ++index) {
    const record: number = offset + 4 + index * 8;
    const platform: number = reader.u16(record, "cmap encoding record");
    const encoding: number = reader.u16(record + 2, "cmap encoding record");
    const unicode: boolean =
      platform === 0 || (platform === 3 && (encoding === 1 || encoding === 10));
    if (!unicode) continue;
    const subtable: number =
      offset + reader.u32(record + 4, "cmap encoding record");
    const format: number = reader.u16(subtable, "cmap subtable");
    if (format === 12 && format12 === null) format12 = subtable;
    else if (format === 4 && format4 === null) format4 = subtable;
  }

  const map: Map<number, number> = new Map();
  function assign(codePoint: number, glyph: number): void {
    if (glyph === 0 || codePoint === 0xffff) return;
    if (glyph >= glyphCount)
      throw new Error(
        `TrueType cmap maps U+${codePoint.toString(16).toUpperCase().padStart(4, "0")} to glyph ${glyph}, past the font's ${glyphCount} glyphs`,
      );
    if (codePoint > 0x10ffff)
      throw new Error(
        `TrueType cmap maps code point ${codePoint}, past U+10FFFF`,
      );
    map.set(codePoint, glyph);
  }

  if (format12 !== null) {
    const groups: number = reader.u32(format12 + 12, "cmap format 12 header");
    reader.require(format12 + 16, groups * 12, "cmap format 12 groups");
    for (let group: number = 0; group < groups; ++group) {
      const at: number = format12 + 16 + group * 12;
      const first: number = reader.u32(at, "cmap format 12 group");
      const last: number = reader.u32(at + 4, "cmap format 12 group");
      const glyph: number = reader.u32(at + 8, "cmap format 12 group");
      if (last < first || last > 0x10ffff)
        throw new Error(
          `TrueType cmap format 12 group ${group} spans ${first} to ${last}, not an increasing range within U+10FFFF`,
        );
      for (let codePoint: number = first; codePoint <= last; ++codePoint)
        assign(codePoint, glyph + codePoint - first);
    }
  } else if (format4 !== null) {
    const segments: number =
      reader.u16(format4 + 6, "cmap format 4 header") / 2;
    const ends: number = format4 + 14;
    const starts: number = ends + segments * 2 + 2;
    const deltas: number = starts + segments * 2;
    const ranges: number = deltas + segments * 2;
    reader.require(ends, segments * 8 + 2, "cmap format 4 segment arrays");
    for (let segment: number = 0; segment < segments; ++segment) {
      const end: number = reader.u16(ends + segment * 2, "cmap format 4");
      const start: number = reader.u16(starts + segment * 2, "cmap format 4");
      const delta: number = reader.i16(deltas + segment * 2, "cmap format 4");
      const rangeAt: number = ranges + segment * 2;
      const range: number = reader.u16(rangeAt, "cmap format 4");
      for (let codePoint: number = start; codePoint <= end; ++codePoint) {
        // idRangeOffset counts bytes from its own slot into glyphIdArray.
        let glyph: number;
        if (range === 0) glyph = (codePoint + delta) & 0xffff;
        else {
          glyph = reader.u16(
            rangeAt + range + 2 * (codePoint - start),
            "cmap format 4 glyph array",
          );
          if (glyph !== 0) glyph = (glyph + delta) & 0xffff;
        }
        assign(codePoint, glyph);
      }
    }
  } else
    throw new Error(
      "TrueType cmap has no Unicode subtable of format 4 or 12 (platform 0, or platform 3 encoding 1 or 10)",
    );
  return new Map(
    [...map.entries()].sort(
      (a: [number, number], b: [number, number]): number => a[0] - b[0],
    ),
  );
}
