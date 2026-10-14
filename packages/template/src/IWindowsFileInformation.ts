/**
 * The fields of `BY_HANDLE_FILE_INFORMATION` the adapter reads.
 *
 * @evidence contracts/common.md#principled-implementation Unsigned native attributes, file index, size, link count and FILETIME retain the information read from one Windows handle.
 * @evidence contracts/common.md#clear-and-simple-design The lowered record keeps only BY_HANDLE_FILE_INFORMATION fields consumed by directory and child qualification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The identity is the actual volume serial and file index, without a substituted inode or copied expected answer.
 * @evidence contracts/common.md#meaningful-documentation Members explain DWORD assembly, exact byte size, raw write ticks and identity formatting.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The Windows handle information record declaration chooses no executable algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The Windows handle information record type coordinates no request or cached work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The Windows handle information record schema acquires no runtime handles, bytes or tasks.
 *
 * @author Samchon
 */
export interface IWindowsFileInformation {
  /** Unsigned Windows file-attribute bits read from BY_HANDLE_FILE_INFORMATION. */
  attributes: number;

  /** Volume serial and 64-bit file index formatted like scaffoldPhysicalIdentity. */
  identity: string;

  /** Raw unsigned FILETIME last-write ticks retained for generation comparison. */
  lastWrite: bigint;

  /** Unsigned native hard-link population reported by the handle. */
  links: number;

  /** Unsigned 64-bit byte size assembled from the native high and low DWORDs. */
  size: bigint;
}
