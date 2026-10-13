import { type IBoundChildStatus } from "./IBoundChildStatus";
/**
 * One child opened relative to a held parent, driven through whatever the
 * platform hands back: a POSIX descriptor served by `node:fs`, or a Windows
 * HANDLE served by kernel32. Node's own C runtime does not share descriptor
 * tables with `ucrtbase.dll`, so a Windows handle is never lowered to a CRT
 * descriptor; every byte, flush, inspection, and close goes through the
 * handle itself.
 
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
   * @evidence contracts/common.md#principled-implementation Release the created or verification child descriptor or HANDLE; native close failure throws.
   * @evidence contracts/common.md#clear-and-simple-design The child descriptor release signature remains with its owning native handle contract instead of a separate platform-specific consumer API.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The child descriptor release declaration introduces no fixture choice, foreign-method replacement or swallowed native failure.
   * @evidence contracts/common.md#meaningful-documentation The method prose states the child descriptor release operation's inputs, result and failure or release meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The child descriptor release signature specifies behavior but contains no executable algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The child descriptor release interface member implements no cross-call reuse or invalidation policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The child descriptor release declaration acquires no resource; the actual native adapter and publication coordinator own lifetime.
   */
  close(): void;

  /**
   * Read at most length bytes into target at offset from the file's byte position; return the transferred count or throw on native failure.
   *
   * @evidence contracts/common.md#principled-implementation Read at most length bytes into target at offset from the file's byte position; return the transferred count or throw on native failure.
   * @evidence contracts/common.md#clear-and-simple-design The positioned child byte reading signature remains with its owning native handle contract instead of a separate platform-specific consumer API.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The positioned child byte reading declaration introduces no fixture choice, foreign-method replacement or swallowed native failure.
   * @evidence contracts/common.md#meaningful-documentation The method prose states the positioned child byte reading operation's inputs, result and failure or release meaning.
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
   * @evidence contracts/common.md#principled-implementation Read ordinary-file, link-count, size and written-generation facts through this held child handle.
   * @evidence contracts/common.md#clear-and-simple-design The held child generation reading signature remains with its owning native handle contract instead of a separate platform-specific consumer API.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The held child generation reading declaration introduces no fixture choice, foreign-method replacement or swallowed native failure.
   * @evidence contracts/common.md#meaningful-documentation The method prose states the held child generation reading operation's inputs, result and failure or release meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The held child generation reading signature specifies behavior but contains no executable algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The held child generation reading interface member implements no cross-call reuse or invalidation policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The held child generation reading declaration acquires no resource; the actual native adapter and publication coordinator own lifetime.
   */
  status(): IBoundChildStatus;

  /**
   * Flush this child's completed writes to its native filesystem handle; failure throws.
   *
   * @evidence contracts/common.md#principled-implementation Flush this child's completed writes to its native filesystem handle; failure throws.
   * @evidence contracts/common.md#clear-and-simple-design The child flush request signature remains with its owning native handle contract instead of a separate platform-specific consumer API.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The child flush request declaration introduces no fixture choice, foreign-method replacement or swallowed native failure.
   * @evidence contracts/common.md#meaningful-documentation The method prose states the child flush request operation's inputs, result and failure or release meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The child flush request signature specifies behavior but contains no executable algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The child flush request interface member implements no cross-call reuse or invalidation policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The child flush request declaration acquires no resource; the actual native adapter and publication coordinator own lifetime.
   */
  sync(): void;

  /**
   * Write at most length bytes from source at offset to the file's byte position; return the confirmed count or throw on native failure.
   *
   * @evidence contracts/common.md#principled-implementation Write at most length bytes from source at offset to the file's byte position; return the confirmed count or throw on native failure.
   * @evidence contracts/common.md#clear-and-simple-design The positioned child byte writing signature remains with its owning native handle contract instead of a separate platform-specific consumer API.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The positioned child byte writing declaration introduces no fixture choice, foreign-method replacement or swallowed native failure.
   * @evidence contracts/common.md#meaningful-documentation The method prose states the positioned child byte writing operation's inputs, result and failure or release meaning.
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
