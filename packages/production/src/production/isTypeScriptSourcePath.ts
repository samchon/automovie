
import path from "node:path";

/**
 * Recognize the supported TypeScript filename extensions for source-byte normalization.
 *
 * Native path.extname and case folding admit .ts, .tsx, .mts and .cts; recognition says nothing about existence, ownership, parse validity or whether Node can execute the module.
 *
 * @evidence contracts/common.md#principled-implementation A closed extension list matches the builder's supported source families. contentFingerprintFields uses it only when the inventory already marks an input as source.
 * @evidence contracts/common.md#clear-and-simple-design One path predicate keeps source normalization selection separate from strict UTF-8 processing and project path admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Case-insensitive extension matching is supported filename policy; a recognized name is not treated as admitted source or repaired content.
 * @evidence contracts/common.md#meaningful-documentation States recognized extensions, case behavior, normalization use and the absence of byte/execution admission.
 * @evidence contracts/performance.md#efficient-algorithms Extension extraction and folding scale with filename text; membership checks a fixed four-element list, allocating no byte payload or directory inventory.
 * @evidence contracts/performance.md#reuse-equivalent-work A cheap current filename decision has no retained cross-request cache; normalized bytes remain owned by the separate content projection.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary extension text expires on return and no path, file handle or task is retained.
 */
export function isTypeScriptSourcePath(
  file: string
): boolean { return [".ts", ".tsx", ".mts", ".cts"].includes(path.extname(file).toLowerCase()); }
