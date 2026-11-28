import type { TrueTypeByteReader } from "./TrueTypeByteReader";

/*
 * Read the horizontal kerning pairs of a `kern` table's format 0 subtables, by
 * glyph index (ISO/IEC 14496-22, section 5.7.4).
 *
 * Only subtables that kern horizontally and hold kerning values, not minimum
 * values or cross-stream adjustments, contribute, since those are what advance
 * glyphs along a line. Their values add across subtables, as the format
 * specifies, unless a subtable's override bit replaces the accumulated value.
 * Subtables of other formats are skipped by their declared length.
 * Parameter reader: Bounds-checked reader over the `kern` table.
 * Returns: Adjustment in font units keyed by `left * 65536 + right` glyph
 * indices. An Apple-format table, whose 32-bit version is 1.0, contributes no
 * pairs.
 * A field lies outside the bytes.
 */
export function readTrueTypeKerning(
  reader: TrueTypeByteReader,
): Map<number, number> {
  // The Apple-format table (a 32-bit version 1.0) is not the OpenType one and
  // contributes no pairs, like a font without kerning.
  if (reader.u16(0, "kern header") !== 0) return new Map();
  const tables: number = reader.u16(2, "kern header");
  const pairs: Map<number, number> = new Map();
  let cursor: number = 4;
  for (let table: number = 0; table < tables; ++table) {
    const length: number = reader.u16(cursor + 2, "kern subtable header");
    const subtable: TrueTypeByteReader = reader.slice(
      cursor,
      length,
      "kern subtable",
    );
    const coverage: number = subtable.u16(4, "kern subtable header");
    if (
      coverage >> 8 === 0 &&
      (coverage & HORIZONTAL) !== 0 &&
      (coverage & (MINIMUM | CROSS_STREAM)) === 0
    ) {
      const count: number = subtable.u16(6, "kern format 0 header");
      subtable.require(14, count * 6, "kern format 0 pairs");
      for (let pair: number = 0; pair < count; ++pair) {
        const at: number = 14 + pair * 6;
        const key: number =
          subtable.u16(at, "kern pair") * 65536 +
          subtable.u16(at + 2, "kern pair");
        const value: number = subtable.i16(at + 4, "kern pair");
        pairs.set(
          key,
          (coverage & OVERRIDE) !== 0 ? value : (pairs.get(key) ?? 0) + value,
        );
      }
    }
    cursor += length;
  }
  return pairs;
}

/*
 * `kern` subtable coverage bit 0 (ISO/IEC 14496-22, section 5.7.4): set when
 * the subtable holds horizontal data, clear for vertical.
 */
const HORIZONTAL: number = 0x01;

/*
 * Coverage bit 1: set when the subtable holds minimum values, not kerning.
 */
const MINIMUM: number = 0x02;

/*
 * Coverage bit 2: set when the kerning is perpendicular to the text flow.
 */
const CROSS_STREAM: number = 0x04;

/*
 * Coverage bit 3: set when the subtable's value replaces the value accumulated
 * so far rather than adding to it.
 */
const OVERRIDE: number = 0x08;
