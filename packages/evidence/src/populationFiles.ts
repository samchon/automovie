import path from "node:path";
import type { IAutoMovieEvidenceConfigProps } from "./IAutoMovieEvidenceConfigProps";
import { matchesGlob } from "./matchesGlob";
import { posix } from "./posix";
import { walkProjectFiles } from "./walkProjectFiles";

/**
 * Walk each selector's concrete prefix, then match physical relative paths against its complete wildcard pattern.
 *
 * @evidence contracts/common.md#principled-implementation Walk each selector's concrete prefix, then match physical relative paths against its complete wildcard pattern.
 * @evidence contracts/common.md#clear-and-simple-design Filesystem confinement is delegated to the project walker while glob semantics remain local.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Selectors are processed in order and overlapping selectors can repeat a file; no undocumented deduplication changes claim identity.
 * @evidence contracts/common.md#meaningful-documentation The result consists of physical paths and a missing population stays empty for its owning gate to reject.
 * @evidence contracts/performance.md#efficient-algorithms Cost follows directory entries for every selector and memoized glob matching per candidate; overlapping roots may repeat walks.
 * @evidence contracts/performance.md#reuse-equivalent-work The matcher memoizes states within one match, but filesystem walks are not shared across selectors or calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned paths and call-local walk arrays grow with residents without a fixed cap; no persistent handles or caches are retained.
 */
export function populationFiles(graph: IAutoMovieEvidenceConfigProps, roots: readonly string[], extension: ".md" | ".ts"): string[] {
  return roots.flatMap((root: string): string[] => {
    const wildcard: number = root.search(/[*?]/u);
    const concrete: string = (wildcard === -1 ? root : root.slice(0, wildcard)).replace(
      /[\\/]+$/u,
      "",
    );
    return walkProjectFiles(
      graph,
      path.join(graph.location, concrete),
      extension,
    ).filter((file: string): boolean =>
      matchesGlob(posix(path.relative(graph.location, file)), root),
    );
  });
}
