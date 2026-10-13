import { type IBoundChildStatus } from "./IBoundChildStatus";
/**
 * One child opened relative to a held parent, driven through whatever the platform hands back: a POSIX descriptor served by `node:fs`, or a Windows HANDLE served by kernel32. Node's own C runtime does not share descriptor tables with `ucrtbase.dll`, so a Windows handle is never lowered to a CRT descriptor; every byte, flush, inspection, and close goes through the handle itself.
 *
 * @evidence contracts/common.md#principled-implementation A held child exposes positioned byte transfer, status, flush and close without converting Windows HANDLEs into unrelated C-runtime descriptors.
 * @evidence contracts/common.md#clear-and-simple-design The publication sequence consumes one child contract while each native adapter owns its actual file primitive.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts All child operations address the held handle, with no retry through a successor pathname or replacement of foreign methods.
 * @evidence contracts/common.md#meaningful-documentation Method comments state byte positions, transferred counts, native failure effects and explicit release ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The held child operation contract declaration chooses no executable algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The held child operation contract type coordinates no request or cached work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The held child operation contract schema acquires no runtime handles, bytes or tasks.
 *
 * @author Samchon
 */
export interface IBoundChild {
  /**
   * Release the created or verification child descriptor or HANDLE; native close failure throws.
   *
   * @evidence contracts/common.md#principled-implementation POSIX closeSync and Windows CloseHandle release the child primitive each adapter acquired; a failed native close throws and cannot establish release.
   * @evidence contracts/common.md#clear-and-simple-design Publication and resident verification call this operation when their own held-child work ends, keeping cleanup sequencing outside the platform adapters.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The child descriptor release declaration introduces no fixture choice, foreign-method replacement or swallowed native failure.
   * @evidence contracts/common.md#meaningful-documentation The prose covers both created and verification children and says native close failure throws; a failed call carries no release guarantee.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The child descriptor release signature specifies behavior but contains no executable algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The child descriptor release interface member implements no cross-call reuse or invalidation policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The child descriptor release declaration acquires no resource; the actual native adapter and publication coordinator own lifetime.
   */
  close(): void;

  /**
   * Read at most `length` bytes into `target` at its byte `offset`, starting at absolute file byte `position`; return the transferred count, including zero at end of file, or throw on native failure.
   *
   * @evidence contracts/common.md#principled-implementation Explicit file and buffer byte positions make POSIX positioned reads and Windows seek-then-read serve the same readback loop; callers provide non-negative positions and lengths within their allocated buffer.
   * @evidence contracts/common.md#clear-and-simple-design The readback owner advances by the returned count, while each adapter supplies native byte transfer and error reporting.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The positioned child byte reading declaration introduces no fixture choice, foreign-method replacement or swallowed native failure.
   * @evidence contracts/common.md#meaningful-documentation The prose distinguishes buffer offset from absolute file position, uses byte units, and states short reads, zero at end of file and thrown native errors.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The positioned child byte reading signature specifies behavior but contains no executable algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The positioned child byte reading interface member implements no cross-call reuse or invalidation policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The positioned child byte reading declaration acquires no resource; the actual native adapter and publication coordinator own lifetime.
   */
  read(
    target: Buffer,
    offset: number,
    length: number,
    position: number,
  ): number;

  /**
   * Read ordinary-file, link-count, size and written-generation facts through this held child handle.
   *
   * @evidence contracts/common.md#principled-implementation fstatSync or GetFileInformationByHandle observes the held child instead of a successor pathname; the version includes physical identity, size and native last-write state for resident comparison.
   * @evidence contracts/common.md#clear-and-simple-design One status record supplies ordinary-file admission, exact-size completion and generation comparison without a second identity-only API.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The held child generation reading declaration introduces no fixture choice, foreign-method replacement or swallowed native failure.
   * @evidence contracts/common.md#meaningful-documentation The prose states handle-based provenance and the returned qualification and generation facts; IBoundChildStatus documents exact byte size and link-count meanings.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The held child generation reading signature specifies behavior but contains no executable algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The held child generation reading interface member implements no cross-call reuse or invalidation policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The held child generation reading declaration acquires no resource; the actual native adapter and publication coordinator own lifetime.
   */
  status(): IBoundChildStatus;

  /**
   * Flush this child's completed writes to its native filesystem handle; failure throws.
   *
   * @evidence contracts/common.md#principled-implementation fsyncSync or FlushFileBuffers flushes this writer before readback and completion, propagating native failure instead of treating a successful write as a successful flush.
   * @evidence contracts/common.md#clear-and-simple-design The publication sequence chooses the flush boundary after its write loop; the adapter owns the platform-specific flush call.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The child flush request declaration introduces no fixture choice, foreign-method replacement or swallowed native failure.
   * @evidence contracts/common.md#meaningful-documentation The prose identifies this child's completed writes as the flush subject and says a failed native flush throws.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The child flush request signature specifies behavior but contains no executable algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The child flush request interface member implements no cross-call reuse or invalidation policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The child flush request declaration acquires no resource; the actual native adapter and publication coordinator own lifetime.
   */
  sync(): void;

  /**
   * Write at most `length` bytes from `source` at its byte `offset`, starting at absolute file byte `position`; return the confirmed transferred count or throw on native failure.
   *
   * @evidence contracts/common.md#principled-implementation Explicit positions map to POSIX positioned writes or Windows seek-then-write; the publication loop supplies an in-bounds source slice and advances only by the native confirmed count, refusing zero progress.
   * @evidence contracts/common.md#clear-and-simple-design Byte transfer returns progress to the publication owner, which alone accumulates partial byte counts and decides when to flush.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The positioned child byte writing declaration introduces no fixture choice, foreign-method replacement or swallowed native failure.
   * @evidence contracts/common.md#meaningful-documentation The prose separates source-buffer offset from absolute file position, specifies byte units and confirmed short-write counts, and says native failure throws.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The positioned child byte writing signature specifies behavior but contains no executable algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The positioned child byte writing interface member implements no cross-call reuse or invalidation policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The positioned child byte writing declaration acquires no resource; the actual native adapter and publication coordinator own lifetime.
   */
  write(
    source: Buffer,
    offset: number,
    length: number,
    position: number,
  ): number;
}
