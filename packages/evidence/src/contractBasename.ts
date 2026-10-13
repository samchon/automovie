import type { IAutoMovieSharedContractReference } from "./IAutoMovieSharedContractReference";

/**
 * The last slash-delimited component identifies a bundled contract within its family.
 *
 * @evidence contracts/common.md#principled-implementation The last slash-delimited component identifies a bundled contract within its family.
 * @evidence contracts/common.md#clear-and-simple-design Filename extraction is separate from domain routing used by the fixed inventory.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The caller supplies canonical slash-separated contract paths; this helper does not validate arbitrary paths.
 * @evidence contracts/common.md#meaningful-documentation The result is the final component, including the Markdown extension.
 * @evidence contracts/performance.md#efficient-algorithms A last-slash search scans the path and slice allocates only the final component, with cost proportional to path length.
 * @evidence contracts/performance.md#reuse-equivalent-work The immutable input is used directly and no cross-call basename cache is maintained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the sliced basename escapes to the caller; no component array or retained cache is created.
 */
export function contractBasename(contract: IAutoMovieSharedContractReference): string {
  return contract.file.slice(contract.file.lastIndexOf("/") + 1);
}
