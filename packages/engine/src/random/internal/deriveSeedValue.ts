import { hashFnv1a64Implementation } from "./hashFnv1a64Implementation";

/*
 * A 64-bit seed derived from a film seed and stable string ids, as sixteen
 * lowercase hexadecimal digits.
 *
 * The ids name what draws (a subject, a channel, a shot), never an ordinal, so
 * inserting or reordering unrelated content leaves every other stream's seed
 * unchanged. FNV-1a reads the UTF-8 bytes of the film seed and each ID,
 * followed by 0xff after each field. UTF-8 never contains the framing byte.
 */
export function deriveSeedValue(
  filmSeed: string,
  ...ids: string[]
): string {
  return hashFnv1a64Implementation(seedBytes(filmSeed, ids));
}

/* Keep each source chunk bounded and retain pairs across UTF-16 boundaries. */
function* seedBytes(
  filmSeed: string,
  ids: readonly string[],
): IterableIterator<number> {
  const encoder: TextEncoder = new TextEncoder();
  const chunkUnits: number = 4096;
  for (let field: number = 0; field <= ids.length; ++field) {
    const text: string = field === 0 ? filmSeed : ids[field - 1]!;
    for (let start: number = 0; start < text.length; ) {
      let end: number = Math.min(start + chunkUnits, text.length);
      const last: number = text.charCodeAt(end - 1);
      if (end < text.length && last >= 0xd800 && last <= 0xdbff) --end;
      yield* encoder.encode(text.slice(start, end));
      start = end;
    }
    yield 0xff;
  }
}
