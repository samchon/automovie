import type {
  IAutoMovieFont,
  IAutoMovieFontGlyph,
  IAutoMovieFontKerning,
  IAutoMovieFontSegment,
} from "@automovie/interface";

import { TrueTypeByteReader } from "./TrueTypeByteReader";
import { readTrueTypeCharacterMap } from "./readTrueTypeCharacterMap";
import { readTrueTypeGlyphOutline } from "./readTrueTypeGlyphOutline";
import { readTrueTypeKerning } from "./readTrueTypeKerning";
import { readTrueTypeNames } from "./readTrueTypeNames";

/** Tables every admitted font must carry. */
const REQUIRED: readonly string[] = [
  "head",
  "hhea",
  "maxp",
  "cmap",
  "hmtx",
  "loca",
  "glyf",
];

/**
 * Decode one TrueType-outline font's bytes into outlines, metrics, kerning and
 * descriptive names, following the Open Font Format (ISO/IEC 14496-22).
 *
 * It admits a single font whose `sfnt` version is `0x00010000` or the tag
 * `true`, and refuses, each with its own diagnostic, CFF outlines (`OTTO`), a
 * font collection (`ttcf`), WOFF (`wOFF`) and WOFF2 (`wOF2`), any other
 * version, a missing required table (`head`, `hhea`, `maxp`, `cmap`, `hmtx`,
 * `loca`, `glyf`), a table record or field outside the bytes, a `head` magic
 * number other than `0x5F0F3CF5`, a units-per-em outside 16 to 16384, and a
 * `loca` offset that decreases or lies past the end of `glyf`.
 *
 * It reads `head` (units per em, `loca` format), `hhea` (ascender, descender,
 * line gap, horizontal metric count), `maxp` (glyph count), `cmap` (formats 4
 * and 12 for Unicode), `hmtx`, `loca` and `glyf`, composite glyphs included;
 * `kern` format 0 pairs when present; the `OS/2` `fsType` and `name` IDs 1, 13
 * and 14 when present. Only glyphs a code point maps to are decoded, each once.
 * Table checksums are not verified: a damaged byte that still decodes yields
 * the outline it encodes, and the asset ledger's digest is what fixes the
 * bytes. Hinting instructions are skipped.
 *
 * The function is pure: the same bytes always give a deep-equal record, and the
 * result shares no storage with the input.
 *
 * @param bytes The font file's bytes; only read.
 * @returns The decoded record in font units.
 * @throws {Error} Any refusal above, naming the format, table, glyph or offset
 *   at fault.
 */
export function decodeAutoMovieTrueTypeFont(bytes: Uint8Array): IAutoMovieFont {
  const reader: TrueTypeByteReader = new TrueTypeByteReader(bytes);
  const version: number = reader.u32(0, "sfnt header");
  const tag: string = reader.tag(0, "sfnt header");
  if (tag === "OTTO")
    throw new Error(
      "The font has CFF outlines (sfnt version OTTO); only TrueType outlines are supported",
    );
  if (tag === "ttcf")
    throw new Error(
      "The bytes are a font collection (ttcf); supply one TrueType font",
    );
  if (tag === "wOFF")
    throw new Error(
      "The bytes are a WOFF font; supply the uncompressed TrueType font",
    );
  if (tag === "wOF2")
    throw new Error(
      "The bytes are a WOFF2 font; supply the uncompressed TrueType font",
    );
  if (version !== 0x00010000 && tag !== "true")
    throw new Error(
      `The bytes are not a TrueType font: sfnt version 0x${version.toString(16).padStart(8, "0")}`,
    );

  // The table directory; every record must lie inside the bytes.
  const count: number = reader.u16(4, "sfnt header");
  const tables: Map<string, { offset: number; length: number }> = new Map();
  for (let index: number = 0; index < count; ++index) {
    const record: number = 12 + index * 16;
    const name: string = reader.tag(record, "table record");
    const offset: number = reader.u32(record + 8, "table record");
    const length: number = reader.u32(record + 12, "table record");
    reader.require(offset, length, `table "${name}"`);
    tables.set(name, { offset, length });
  }
  for (const name of REQUIRED)
    if (!tables.has(name))
      throw new Error(`The TrueType font is missing required table "${name}"`);
  const table: (name: string, minimum: number) => number = (
    name: string,
    minimum: number,
  ): number => {
    const found: { offset: number; length: number } = tables.get(name)!;
    if (found.length < minimum)
      throw new Error(
        `TrueType table "${name}" is ${found.length} bytes, shorter than its ${minimum}-byte header`,
      );
    return found.offset;
  };

  const head: number = table("head", 54);
  if (reader.u32(head + 12, "head") !== 0x5f0f3cf5)
    throw new Error("TrueType head table magic number is not 0x5F0F3CF5");
  const unitsPerEm: number = reader.u16(head + 18, "head");
  if (unitsPerEm < 16 || unitsPerEm > 16384)
    throw new Error(
      `TrueType units per em ${unitsPerEm} is outside the 16 to 16384 range the format allows`,
    );
  const longOffsets: boolean = reader.i16(head + 50, "head") === 1;

  const hhea: number = table("hhea", 36);
  const ascender: number = reader.i16(hhea + 4, "hhea");
  const descender: number = reader.i16(hhea + 6, "hhea");
  const lineGap: number = reader.i16(hhea + 8, "hhea");
  const metrics: number = reader.u16(hhea + 34, "hhea");
  const glyphCount: number = reader.u16(table("maxp", 6) + 4, "maxp");
  if (metrics === 0 || metrics > glyphCount)
    throw new Error(
      `TrueType hhea declares ${metrics} horizontal metrics for ${glyphCount} glyphs`,
    );

  // Glyphs past the last full metric repeat its advance.
  const hmtx: number = table("hmtx", 0);
  reader.require(hmtx, metrics * 4 + (glyphCount - metrics) * 2, "hmtx table");
  const advance: (glyph: number) => number = (glyph: number): number =>
    reader.u16(hmtx + Math.min(glyph, metrics - 1) * 4, "hmtx");

  // loca: one offset per glyph and one past the last, increasing within glyf.
  const glyf: { offset: number; length: number } = tables.get("glyf")!;
  const locaAt: number = table(
    "loca",
    (glyphCount + 1) * (longOffsets ? 4 : 2),
  );
  const loca: number[] = [];
  for (let glyph: number = 0; glyph <= glyphCount; ++glyph) {
    const value: number = longOffsets
      ? reader.u32(locaAt + glyph * 4, "loca")
      : reader.u16(locaAt + glyph * 2, "loca") * 2;
    if (value > glyf.length)
      throw new Error(
        `TrueType loca offset ${value} for glyph ${glyph} lies past the end of the ${glyf.length}-byte glyf table`,
      );
    if (glyph > 0 && value < loca[glyph - 1]!)
      throw new Error(
        `TrueType loca offset ${value} for glyph ${glyph} decreases from ${loca[glyph - 1]}`,
      );
    loca.push(value);
  }

  const characters: Map<number, number> = readTrueTypeCharacterMap(
    reader,
    table("cmap", 4),
    glyphCount,
  );
  const cache: Map<number, IAutoMovieFontSegment[][]> = new Map();
  const glyphs: IAutoMovieFontGlyph[] = [];
  const codePoints: Map<number, number[]> = new Map();
  for (const [codePoint, glyph] of characters) {
    const contours: IAutoMovieFontSegment[][] = readTrueTypeGlyphOutline({
      reader,
      glyf: glyf.offset,
      loca,
      glyph,
      cache,
    });
    glyphs.push({
      codePoint,
      advance: advance(glyph),
      contours: contours.map(
        (contour: IAutoMovieFontSegment[]): IAutoMovieFontSegment[] =>
          contour.map(
            (segment: IAutoMovieFontSegment): IAutoMovieFontSegment => ({
              start: [...segment.start],
              control: [...segment.control],
              end: [...segment.end],
            }),
          ),
      ),
    });
    const shared: number[] | undefined = codePoints.get(glyph);
    if (shared === undefined) codePoints.set(glyph, [codePoint]);
    else shared.push(codePoint);
  }

  // Kerning by glyph pair, expanded to every code point pair that maps to it.
  const kerning: IAutoMovieFontKerning[] = [];
  if (tables.has("kern"))
    for (const [key, value] of readTrueTypeKerning(reader, table("kern", 4))) {
      if (value === 0) continue;
      for (const left of codePoints.get(Math.floor(key / 65536)) ?? [])
        for (const right of codePoints.get(key % 65536) ?? [])
          kerning.push({ left, right, value });
    }
  kerning.sort(
    (a: IAutoMovieFontKerning, b: IAutoMovieFontKerning): number =>
      a.left - b.left || a.right - b.right,
  );

  return {
    unitsPerEm,
    ascender,
    descender,
    lineGap,
    glyphs,
    kerning,
    fsType: tables.has("OS/2")
      ? reader.u16(table("OS/2", 10) + 8, "OS/2")
      : null,
    names: tables.has("name")
      ? readTrueTypeNames(reader, table("name", 6))
      : { family: null, licenseDescription: null, licenseUrl: null },
  };
}
