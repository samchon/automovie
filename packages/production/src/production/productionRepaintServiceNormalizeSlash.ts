import path from "node:path";

/**
 * Replaces platform separators with portable forward slashes for the existing project-relative paths.
 *
 * @evidence contracts/common.md#principled-implementation Replaces platform separators with portable forward slashes for the existing project-relative paths.
 * @evidence contracts/common.md#clear-and-simple-design This file-named helper owns one original service value/admission operation; project lookup, dispatch and publication sequencing remain with the service coordinator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation Only returned path text survives; filesystem admission remains with project readers.
 * @evidence contracts/performance.md#efficient-algorithms String replacement scales with path length and does not validate traversal or filesystem identity.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-call value/disclosure operation does not coordinate completed or in-flight results across requests; its original inputs remain local and its callers own effectful equivalence/currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only returned path text survives; filesystem admission remains with project readers.
 */
export const productionRepaintServiceNormalizeSlash: (value: string) => string = (value: string): string =>
  value.split(path.sep).join("/");
