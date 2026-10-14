/**
 * Identify an absent builder-owned file without interpreting arbitrary error text.
 *
 * readGeneratedFile throws this only after a missing physical path observation.
 * Status comparison treats this absence as intended creation; every other
 * storage failure, including non-Error thrown values, propagates unchanged.
 *
 * @evidence contracts/common.md#principled-implementation A dedicated Error identity separates proved path absence from permission, namespace, symlink and arbitrary storage failures while preserving the existing missing-file message.
 * @evidence contracts/common.md#clear-and-simple-design The production project owns the absence observation and statusesOf consumes this narrow identity rather than parsing foreign error messages.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No failure is converted to creation because it resembles an absence string, and unrecognized thrown values are not swallowed.
 * @evidence contracts/common.md#meaningful-documentation States the throwing boundary and the one status-comparison meaning of this error.
 * @evidence contracts/performance.md#efficient-algorithms Message allocation scales with relative-path length and native Error stack capture has runtime-dependent cost; construction rescans no filesystem data.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Absence is a current observation and no error instance or status is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The handling caller owns the message and native stack until release; the class acquires no handle and retains no file bytes.
 */
export class AutoMovieGeneratedFileMissingError extends Error {
  public constructor(relativePath: string) {
    super(`Generated file "${relativePath}" does not exist.`);
    this.name = "AutoMovieGeneratedFileMissingError";
  }
}
