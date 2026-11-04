/** Base64 digits of a source map's VLQ segments. */
const DIGITS: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** A page module's address in a stack: origin, path ending in `.ts` or `.tsx`, optional query, line and column. */
const FRAME: RegExp = /https?:\/\/[^/\s()]+(\/[^\s()?]+\.tsx?)(?:\?[^\s():]*)?:(\d+):(\d+)/g;

/**
 * Rewrite every page module address in a stack text to the TypeScript file, line and column it
 * came from.
 *
 * The page runs the modules Vite served, transformed from the TypeScript sources, so the line and
 * column a browser stack names are the transformed code's. Each address
 * `http://<host>/<path>.ts:<line>:<column>` is read back through that module's source map
 * (`mappings`, decoded here) and written `<path>.ts:<line>:<column>` without the origin, in the
 * source's own numbers. The maps are the server's current transforms, so a file saved after the page
 * loaded maps by its newer text. An address without a map, or outside its mappings, keeps its
 * transformed numbers and is marked `(unmapped)`.
 *
 * @param text Stack text, any number of lines.
 * @param load The module's source map `mappings` for a served path, or null when it has none.
 * @returns The text with every module address mapped.
 */
export async function HumanDebugStackMap(
  text: string,
  load: (path: string) => Promise<string | null>,
): Promise<string> {
  const maps: Map<string, number[][][] | null> = new Map();
  for (const match of text.matchAll(FRAME)) {
    const path: string = match[1]!;
    if (maps.has(path)) continue;
    const mappings: string | null = await load(path).catch((): null => null);
    maps.set(path, mappings === null || mappings === "" ? null : HumanDebugStackMap.decode(mappings));
  }
  return text.replace(FRAME, (_whole: string, path: string, line: string, column: string): string => {
    const lines: number[][][] | null = maps.get(path) ?? null;
    const found: [number, number] | null = lines === null ? null : HumanDebugStackMap.locate(lines, Number(line), Number(column));
    const at: string = path.replace(/^\//, "");
    return found === null ? at + ":" + line + ":" + column + " (unmapped)" : at + ":" + found[0] + ":" + found[1];
  });
}

/** The source map arithmetic of {@link HumanDebugStackMap}. */
export namespace HumanDebugStackMap {
  /**
   * Decode a source map's `mappings` into absolute segments per generated line.
   *
   * @param mappings The `mappings` text: lines split by `;`, segments by `,`, Base64 VLQ fields.
   * @returns Per generated line, its segments `[generated column, source, source line, source column]`, zero-based.
   */
  export function decode(mappings: string): number[][][] {
    const lines: number[][][] = [];
    let source: number = 0;
    let sourceLine: number = 0;
    let sourceColumn: number = 0;
    for (const row of mappings.split(";")) {
      const segments: number[][] = [];
      let column: number = 0;
      for (const segment of row.split(",")) {
        if (segment === "") continue;
        const fields: number[] = vlq(segment);
        column += fields[0]!;
        if (fields.length >= 4) {
          source += fields[1]!;
          sourceLine += fields[2]!;
          sourceColumn += fields[3]!;
          segments.push([column, source, sourceLine, sourceColumn]);
        }
      }
      lines.push(segments);
    }
    return lines;
  }

  /**
   * The source line and column of a generated position: the last segment of its line at or before its column.
   *
   * @param lines Decoded segments per generated line.
   * @param line Generated line, one-based.
   * @param column Generated column, one-based.
   * @returns Source line and column, one-based, or null outside the mappings.
   */
  export function locate(lines: readonly (readonly (readonly number[])[])[], line: number, column: number): [number, number] | null {
    const segments: readonly (readonly number[])[] | undefined = lines[line - 1];
    if (segments === undefined || segments.length === 0) return null;
    let best: readonly number[] = segments[0]!;
    for (const segment of segments) if (segment[0]! <= column - 1) best = segment;
    return [best[2]! + 1, best[3]! + 1];
  }
}

/** The signed values of one VLQ segment. */
function vlq(segment: string): number[] {
  const values: number[] = [];
  let value: number = 0;
  let shift: number = 0;
  for (const character of segment) {
    const digit: number = DIGITS.indexOf(character);
    if (digit < 0) return values;
    value += (digit & 31) * 2 ** shift;
    if ((digit & 32) !== 0) {
      shift += 5;
      continue;
    }
    values.push(value % 2 === 1 ? -(value - 1) / 2 : value / 2);
    value = 0;
    shift = 0;
  }
  return values;
}
