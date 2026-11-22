import type { Profiler } from "node:inspector";
import type { Session } from "node:inspector/promises";

/**
 * The precise coverage of the functions with one name in one source module,
 * read from a coverage the session took, whether the module ran as its own
 * script or inside a bundle.
 *
 * Run from its source (`pnpm test`), a module is its own script and its URL
 * names its file. Run from an esbuild bundle (`pnpm test:esbuild`), its code
 * lies inside a chunk whose URL names the chunk, and esbuild writes each
 * module's path as a line comment before the module's code; the module's
 * functions are those whose ranges start between its comment and the next
 * module's, a top-level one that collides with another module's renamed by
 * a number appended to its name. A function is matched by its name in the
 * module it belongs to, never by the script that happens to hold it.
 *
 * @param session The connected session, the Debugger domain enabled so it can
 *   read a chunk's source.
 * @param coverage The coverage the session took.
 * @param module A pattern the module's file path matches.
 * @param name The function's name.
 * @returns Each matching function's coverage, in script order.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two ways a module runs, how each is read and what is matched.
 * @evidence contracts/development/implementation.md#principled-implementation A script named by the module's own file contributes its functions by name; a bundle chunk contributes those whose first range starts inside the module's span, read from the module path comments esbuild emits in an unminified bundle.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the scripts: the module's own script, else the chunk spans of the module.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No function is matched by a renamed or minified name and no chunk name is assumed; a module absent from every script contributes nothing, which the caller reads as missing.
 * @evidence contracts/development/implementation.md#efficient-algorithms Reads the source of the file-backed scripts only, once each, and scans its lines once.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call reads the coverage it is given; nothing is kept between calls.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no source or coverage past the call; the session stays the caller's.
 */
export async function moduleFunctionCoverage(
  session: Session,
  coverage: Profiler.TakePreciseCoverageReturnType,
  module: RegExp,
  name: string,
): Promise<Profiler.FunctionCoverage[]> {
  const found: Profiler.FunctionCoverage[] = [];
  // A bundle names a top-level function that collides with another module's
  // by appending a number to its name.
  const renamed: RegExp = new RegExp(
    `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\d*$`,
    "u",
  );
  for (const script of coverage.result) {
    if (module.test(script.url)) {
      found.push(
        ...script.functions.filter(
          (fn: Profiler.FunctionCoverage): boolean => fn.functionName === name,
        ),
      );
      continue;
    }
    const named: Profiler.FunctionCoverage[] = script.functions.filter(
      (fn: Profiler.FunctionCoverage): boolean => renamed.test(fn.functionName),
    );
    if (named.length === 0 || !script.url.startsWith("file:")) continue;

    // The module's spans inside the chunk: from its path comment to the next
    // module's path comment, or the chunk's end.
    const source: string = (
      await session.post("Debugger.getScriptSource", {
        scriptId: script.scriptId,
      })
    ).scriptSource;
    const spans: [number, number][] = [];
    let open: number | null = null;
    for (const marker of source.matchAll(MARKER)) {
      if (open !== null) spans.push([open, marker.index]);
      open = module.test(marker[1]!) ? marker.index : null;
    }
    if (open !== null) spans.push([open, source.length]);
    for (const fn of named) {
      const start: number | undefined = fn.ranges[0]?.startOffset;
      if (
        start !== undefined &&
        spans.some(
          ([from, to]: [number, number]): boolean =>
            start >= from && start < to,
        )
      )
        found.push(fn);
    }
  }
  return found;
}

/** A line comment esbuild writes before each module of an unminified bundle: the module's path relative to the build's working directory. */
const MARKER: RegExp = /^\/\/ (\S+\.[cm]?[jt]sx?)$/gmu;
