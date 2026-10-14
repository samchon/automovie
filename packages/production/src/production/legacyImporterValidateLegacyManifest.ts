import type { legacyImporterLegacyManifest } from "./legacyImporterLegacyManifest";

/**
 * Admit a nonnull nonarray object with version exactly one and an asset array whose entries are strings. Canonical path, existence and case-collision checks occur later during snapshot capture.
 *
 * @evidence contracts/common.md#principled-implementation Runtime shape checks establish only the legacy fields this reader requires; subsequent capture validates each asset path before filesystem use.
 * @evidence contracts/common.md#clear-and-simple-design Keeps manifest shape admission separate from path/population observation so malformed declarations fail before inventory traversal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No untyped object is asserted as valid without checks, but extra fields and duplicate asset strings remain accepted by this established v1 admission.
 * @evidence contracts/common.md#meaningful-documentation States exact version/string-array requirements and the deferred path checks rather than claiming complete project validation.
 * @evidence contracts/performance.md#efficient-algorithms Scanning A asset entries costs O(A) time with constant auxiliary state and returns the original object reference.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses the already parsed manifest and avoids cloning; no validation result is retained across mutable manifest inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Acquires no resources and returns caller-owned parsed data by reference; snapshot capture separately copies path and byte populations.
 */
export const legacyImporterValidateLegacyManifest: (value: unknown, file: string) => legacyImporterLegacyManifest = (
  value: unknown,
  file: string,
): legacyImporterLegacyManifest => {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    (value as { version?: unknown }).version !== 1 ||
    Array.isArray((value as { assets?: unknown }).assets) === false ||
    (value as { assets: unknown[] }).assets.some(
      (asset: unknown): boolean => typeof asset !== "string",
    )
  )
    throw new Error(
      `Legacy manifest "${file}" must contain version 1 and a string asset array.`,
    );
  return value as legacyImporterLegacyManifest;
};
