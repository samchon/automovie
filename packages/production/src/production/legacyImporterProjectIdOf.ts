import path from "node:path";

/**
 * Use the trimmed canonical root basename as this import draft's project identifier; root admission and project validation own directory and identifier suitability.
 *
 * @evidence contracts/common.md#principled-implementation Basename and trimming preserve the established directory-derived import identity without hashing or normalizing unrelated project content.
 * @evidence contracts/common.md#clear-and-simple-design Shares one identifier derivation between production draft and manifest construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fixture name or fallback identifier is substituted; this helper itself does not establish uniqueness across unrelated directories.
 * @evidence contracts/common.md#meaningful-documentation Documents basename derivation and the limits of uniqueness/validation authority.
 * @evidence contracts/performance.md#efficient-algorithms Path parsing and trimming cost root/basename character length, producing one string.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the derivation for every manifest/draft field but caches no mutable root authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a scalar string without a descriptor, lease or retained registry.
 */
export const legacyImporterProjectIdOf: (root: string) => string = (root: string): string => path.basename(root).trim();
