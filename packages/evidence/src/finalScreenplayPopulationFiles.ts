import type { IAutoMovieEvidenceConfigProps } from "./IAutoMovieEvidenceConfigProps";
import { authoredPopulationFiles } from "./authoredPopulationFiles";

/**
 * Final screenplay selectors preserve the construction delivery inventory.
 *
 * @evidence contracts/common.md#principled-implementation Replace the construction screenplay prefix with final/screenplays while preserving the scoped delivery selectors.
 * @evidence contracts/common.md#clear-and-simple-design Final expression and construction populations share the same scope rule so counterpart identity can be checked separately.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The first-pilot group remains exact rather than being widened when final files are absent.
 * @evidence contracts/common.md#meaningful-documentation Selectors are relative to docs and select numbered units rather than group indexes.
 * @evidence contracts/performance.md#efficient-algorithms The operation maps a constant-sized selector list, with cost proportional to selector text.
 * @evidence contracts/performance.md#reuse-equivalent-work Construction population rules are reused instead of restating the pilot grammar.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only fresh selector strings and their array escape; no filesystem work is retained.
 */
export function finalScreenplayPopulationFiles(graph: IAutoMovieEvidenceConfigProps): string[] {
  return authoredPopulationFiles(graph, "screenplays").map((file: string): string => `final/${file}`);
}
