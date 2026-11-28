import type { IAutoMovieFont } from "@automovie/interface";

import type { TrueTypeByteReader } from "./TrueTypeByteReader";

/*
 * Read name IDs 1 (family), 13 (licence description) and 14 (licence URL) from
 * a `name` table (ISO/IEC 14496-22, section 5.2.6).
 *
 * For each ID the Windows Unicode record in US English (platform 3, encoding 1
 * or 10, language 0x0409) is preferred, then any Windows Unicode record, then a
 * Unicode-platform record (platform 0); all three are UTF-16BE. A Macintosh
 * Roman record (platform 1, encoding 0) is used last, and only when every byte
 * is ASCII, because Mac Roman differs from Latin-1 above 0x7F and a guessed
 * decoding would misstate a licence. Records are only described here; no rights
 * are judged.
 * Parameter reader: Bounds-checked reader over the `name` table.
 * Returns: The three names, each `null` when no usable record carries it.
 * A record or its string lies outside the bytes.
 */
export function readTrueTypeNames(
  reader: TrueTypeByteReader,
): IAutoMovieFont["names"] {
  const count: number = reader.u16(2, "name header");
  const strings: number = reader.u16(4, "name header");
  reader.require(6, count * 12, "name records");
  const best: Map<number, { rank: number; text: string }> = new Map();
  for (let index: number = 0; index < count; ++index) {
    const record: number = 6 + index * 12;
    const platform: number = reader.u16(record, "name record");
    const encoding: number = reader.u16(record + 2, "name record");
    const language: number = reader.u16(record + 4, "name record");
    const id: number = reader.u16(record + 6, "name record");
    if (id !== 1 && id !== 13 && id !== 14) continue;
    const length: number = reader.u16(record + 8, "name record");
    const at: number = strings + reader.u16(record + 10, "name record");
    reader.require(at, length, "name string");

    let rank: number;
    let text: string | null = null;
    if (platform === 3 && (encoding === 1 || encoding === 10)) {
      rank = language === 0x0409 ? 0 : 1;
      text = utf16(reader, at, length);
    } else if (platform === 0) {
      rank = 2;
      text = utf16(reader, at, length);
    } else if (platform === 1 && encoding === 0) {
      rank = 3;
      const codes: number[] = [];
      for (let byte: number = 0; byte < length; ++byte)
        codes.push(reader.u8(at + byte, "name string"));
      if (codes.every((code: number): boolean => code < 0x80))
        text = String.fromCharCode(...codes);
    } else continue;
    if (text === null) continue;
    const previous: { rank: number; text: string } | undefined = best.get(id);
    if (previous === undefined || rank < previous.rank)
      best.set(id, { rank, text });
  }
  return {
    family: best.get(1)?.text ?? null,
    licenseDescription: best.get(13)?.text ?? null,
    licenseUrl: best.get(14)?.text ?? null,
  };
}

/*
 * Decode UTF-16BE code units, surrogate pairs included.
 */
function utf16(reader: TrueTypeByteReader, at: number, length: number): string {
  const units: number[] = [];
  for (let unit: number = 0; unit + 1 < length; unit += 2)
    units.push(reader.u16(at + unit, "name string"));
  return String.fromCharCode(...units);
}
