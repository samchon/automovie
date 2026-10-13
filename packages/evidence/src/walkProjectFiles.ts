import type { IAutoMovieEvidenceConfigProps } from "./IAutoMovieEvidenceConfigProps";
import { walkAutoMovieProjectPopulationFiles } from "./walkAutoMovieProjectPopulationFiles";

/**
 * Walk one local population after proving its physical boundary.
 *
 * @evidence contracts/common.md#principled-implementation Delegate physical population walking to the project-boundary owner with the supplied root and extension.
 * @evidence contracts/common.md#clear-and-simple-design The graph wrapper passes its current location so symlink and boundary checks remain centralized.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No recursive fallback bypasses the canonical walker and empty populations are returned unchanged.
 * @evidence contracts/common.md#meaningful-documentation The output is the walker's deterministic physical file list; stage admission handles required population presence.
 * @evidence contracts/performance.md#efficient-algorithms Directory entries, file checks and sorting in the delegated walker dominate cost according to resident population.
 * @evidence contracts/performance.md#reuse-equivalent-work The canonical walker is reused across host and target consumers; this wrapper adds no cross-call filesystem cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned file list; synchronous walker handles do not persist beyond traversal.
 */
export function walkProjectFiles(graph: IAutoMovieEvidenceConfigProps, root: string, extension: ".md" | ".ts"): string[] {
  return walkAutoMovieProjectPopulationFiles(graph.location, root, extension);
}
