import type { IProductionGateKey } from "./IProductionGateKey";

/**
 * Stable pass identity for dependency and diagnostic joins.
 *
 * @evidence contracts/common.md#principled-implementation Joining the closed layer and pass names with a slash produces the same key for dependency maps and diagnostic owner comparisons; their literals contain no slash.
 * @evidence contracts/common.md#clear-and-simple-design The identity formatter centralizes the join spelling for all graph consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The delimiter follows the domain key representation for every pass rather than a fixture-specific naming scheme.
 * @evidence contracts/common.md#meaningful-documentation The comment states dependency/diagnostic join usage; the key type documents valid layer and pass components.
 * @evidence contracts/performance.md#efficient-algorithms Time and output length scale with the two key strings, whose typed literal vocabularies have bounded lengths.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This scalar key formatter coordinates no cross-request results or effectful work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only the returned string survives the call; it owns no retained map, handle or task.
 */
export function passId(key: IProductionGateKey): string {
  return `${key.layer}/${key.pass}`;
}
