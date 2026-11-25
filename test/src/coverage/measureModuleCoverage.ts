import type { Profiler } from "node:inspector";
import ts from "typescript-compiler";

import type { IModuleCoverage } from "./IModuleCoverage";
import { enumerateCoverageTargets } from "./enumerateCoverageTargets";

/**
 * The coverage of the modules one bundle chunk holds, read from the block
 * coverage V8 took of that chunk.
 *
 * Esbuild writes each module's path as a line comment before the module's code
 * in an unminified bundle, so a module's span runs from its comment to the next
 * one. The chunk is parsed once as JavaScript and its targets
 * (`enumerateCoverageTargets`) fall into the spans of the modules in scope. The
 * count at an offset is the count of the innermost V8 range holding it: V8's
 * ranges nest, a function's first range is its call count and each further
 * range a block whose count differs from its parent's, so one sweep of the
 * ranges and the sorted offsets with a stack of open ranges reads them all.
 *
 * @param chunk The chunk's JavaScript, as the run loaded it.
 * @param functions The chunk script's function coverages.
 * @param resolve The absolute path of the module a path comment names, or null
 *   for a module out of scope.
 * @returns The coverage of each in-scope module, in chunk order.
 */
export function measureModuleCoverage(
  chunk: string,
  functions: readonly Profiler.FunctionCoverage[],
  resolve: (comment: string) => string | null,
): IModuleCoverage[] {
  // The in-scope modules' spans.
  const spans: ISpan[] = [];
  let open: ISpan | null = null;
  for (const marker of chunk.matchAll(MARKER)) {
    if (open !== null) open.to = marker.index;
    const file: string | null = resolve(marker[1]!);
    open =
      file === null ? null : { file, from: marker.index, to: chunk.length };
    if (open !== null) spans.push(open);
  }
  if (spans.length === 0) return [];

  const source: ts.SourceFile = ts.createSourceFile(
    "chunk.js",
    chunk,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  const targets: enumerateCoverageTargets.ITarget[] = enumerateCoverageTargets(
    source,
    false,
  );
  const counts: Map<number, number> = countAt(
    functions,
    targets.flatMap((target: enumerateCoverageTargets.ITarget): number[] =>
      target.minus === null ? [target.at] : [target.at, target.minus],
    ),
  );
  const modules: IModuleCoverage[] = spans.map(
    (span: ISpan): IModuleCoverage => ({
      file: span.file,
      loaded: true,
      functions: [],
      branches: [],
    }),
  );
  for (const target of targets) {
    const index: number = spanOf(spans, target.at);
    if (index < 0) continue;
    const reached: number =
      counts.get(target.at)! -
      (target.minus === null ? 0 : counts.get(target.minus)!);
    const entry: IModuleCoverage.ITarget = {
      name: target.name,
      covered: reached > 0,
    };
    if (target.kind === "function") modules[index]!.functions.push(entry);
    else modules[index]!.branches.push(entry);
  }
  return modules;
}

/** A line comment esbuild writes before each module: its relative path. */
const MARKER: RegExp = /^\/\/ (\S+\.[A-Za-z]+)$/gmu;

/** One in-scope module's span in the chunk. */
interface ISpan {
  /** The module's absolute path. */
  file: string;

  /** The offset of its path comment. */
  from: number;

  /** The offset of the next module's comment, or the chunk's end. */
  to: number;
}

/** One V8 range. */
interface IRange {
  /** The first offset, inclusive. */
  start: number;

  /** The last offset, exclusive. */
  end: number;

  /** How often the range ran. */
  count: number;
}

/** The index of the span holding an offset, or -1. */
function spanOf(spans: readonly ISpan[], offset: number): number {
  let low: number = 0;
  let high: number = spans.length - 1;
  while (low <= high) {
    const middle: number = (low + high) >> 1;
    const span: ISpan = spans[middle]!;
    if (offset < span.from) high = middle - 1;
    else if (offset >= span.to) low = middle + 1;
    else return middle;
  }
  return -1;
}

/**
 * The count at each offset: the innermost range holding it, zero outside every
 * range.
 */
function countAt(
  functions: readonly Profiler.FunctionCoverage[],
  offsets: readonly number[],
): Map<number, number> {
  // Outer ranges first at one start, so a nested range lies above its parent.
  const ranges: IRange[] = functions
    .flatMap((fn: Profiler.FunctionCoverage): IRange[] =>
      fn.ranges.map(
        (range: Profiler.CoverageRange): IRange => ({
          start: range.startOffset,
          end: range.endOffset,
          count: range.count,
        }),
      ),
    )
    .sort((a: IRange, b: IRange): number => a.start - b.start || b.end - a.end);
  const sorted: number[] = [...new Set(offsets)].sort(
    (a: number, b: number): number => a - b,
  );
  const counts: Map<number, number> = new Map();
  const stack: IRange[] = [];
  let next: number = 0;
  for (const offset of sorted) {
    while (next < ranges.length && ranges[next]!.start <= offset) {
      const range: IRange = ranges[next++]!;
      while (stack.length !== 0 && stack.at(-1)!.end <= range.start)
        stack.pop();
      stack.push(range);
    }
    while (stack.length !== 0 && stack.at(-1)!.end <= offset) stack.pop();
    counts.set(offset, stack.at(-1)?.count ?? 0);
  }
  return counts;
}
