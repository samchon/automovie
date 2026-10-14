

/**
 * The v1 fields snapshot capture requires: format version one and registered asset strings. Extra fields may remain in the resident manifest, while capture separately admits canonical paths and current bytes.
 *
 * @evidence contracts/common.md#principled-implementation Models only the version and asset population read by import capture, with runtime string-array validation at the manifest boundary.
 * @evidence contracts/common.md#clear-and-simple-design Keeps declaration shape separate from physical path/asset observation rather than mixing filesystem authority into the manifest type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not imply extra-field refusal, asset existence or unique/canonical paths merely from TypeScript types.
 * @evidence contracts/common.md#meaningful-documentation States retained v1 field meanings and deferred canonical path/content validation.
 * @evidence contracts/performance.md#efficient-algorithms The interface performs no algorithm; A asset entries are checked and captured by the manifest/snapshot owners.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares the existing registered path list as input but defines no validation cache or cross-revision equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller-owned asset array retains path strings without a numeric count cap; the type owns no descriptor or lock.
 * @author Samchon
 */
export interface legacyImporterLegacyManifest {
  /** Resident legacy manifest format, admitted exactly as version one. */
  version: 1;

  /** Registered asset strings; canonical relative-path admission occurs during snapshot capture. */
  assets: string[];
}
