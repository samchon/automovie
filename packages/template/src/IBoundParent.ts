import { type ICreateResult } from "./ICreateResult";
import { type IBoundParentStatus } from "./IBoundParentStatus";
import { type IBoundChild } from "./IBoundChild";
/**
 * A parent directory handle held for one publication.
 *
 * @evidence contracts/common.md#principled-implementation A held directory authority supplies exclusive create and resident reopen relative to the same parent handle.
 * @evidence contracts/common.md#clear-and-simple-design The platform-neutral contract lets publication order stay in one coordinator while POSIX and Windows own native opening.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts There is no absolute-child fallback, cleanup switch or fixture-dependent alternative in the parent contract.
 * @evidence contracts/common.md#meaningful-documentation Method comments state directory identity inspection, exclusive-slot outcomes and explicit parent and child release.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The held parent operation contract declaration chooses no executable algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The held parent operation contract type coordinates no request or cached work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The held parent operation contract schema acquires no runtime handles, bytes or tasks.
 *
 * @author Samchon
 */
export interface IBoundParent {
  /**
   * Release the held parent descriptor or HANDLE; native close failure throws.
   *
   * @evidence contracts/common.md#principled-implementation Release the held parent descriptor or HANDLE; native close failure throws.
   * @evidence contracts/common.md#clear-and-simple-design The parent descriptor release signature remains with its owning native handle contract instead of a separate platform-specific consumer API.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The parent descriptor release declaration introduces no fixture choice, foreign-method replacement or swallowed native failure.
   * @evidence contracts/common.md#meaningful-documentation The method prose states the parent descriptor release operation's inputs, result and failure or release meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The parent descriptor release signature specifies behavior but contains no executable algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The parent descriptor release interface member implements no cross-call reuse or invalidation policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The parent descriptor release declaration acquires no resource; the actual native adapter and publication coordinator own lifetime.
   */
  close(): void;

  /**
   * Reserve one absent child segment relative to this parent; report opened, clean refusal or a created slot without a usable handle.
   *
   * @evidence contracts/common.md#principled-implementation Reserve one absent child segment relative to this parent; report opened, clean refusal or a created slot without a usable handle.
   * @evidence contracts/common.md#clear-and-simple-design The exclusive child slot reservation signature remains with its owning native handle contract instead of a separate platform-specific consumer API.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The exclusive child slot reservation declaration introduces no fixture choice, foreign-method replacement or swallowed native failure.
   * @evidence contracts/common.md#meaningful-documentation The method prose states the exclusive child slot reservation operation's inputs, result and failure or release meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The exclusive child slot reservation signature specifies behavior but contains no executable algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The exclusive child slot reservation interface member implements no cross-call reuse or invalidation policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The exclusive child slot reservation declaration acquires no resource; the actual native adapter and publication coordinator own lifetime.
   */
  createExclusive(childName: string): ICreateResult;

  /**
   * Read whether the held parent is a directory and its physical identity without reopening its pathname.
   *
   * @evidence contracts/common.md#principled-implementation Read whether the held parent is a directory and its physical identity without reopening its pathname.
   * @evidence contracts/common.md#clear-and-simple-design The held parent directory inspection signature remains with its owning native handle contract instead of a separate platform-specific consumer API.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The held parent directory inspection declaration introduces no fixture choice, foreign-method replacement or swallowed native failure.
   * @evidence contracts/common.md#meaningful-documentation The method prose states the held parent directory inspection operation's inputs, result and failure or release meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The held parent directory inspection signature specifies behavior but contains no executable algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The held parent directory inspection interface member implements no cross-call reuse or invalidation policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The held parent directory inspection declaration acquires no resource; the actual native adapter and publication coordinator own lifetime.
   */
  inspect(): IBoundParentStatus;

  /**
   * Reopen one existing child segment for read-only verification relative to this parent; native failure throws.
   *
   * @evidence contracts/common.md#principled-implementation Reopen one existing child segment for read-only verification relative to this parent; native failure throws.
   * @evidence contracts/common.md#clear-and-simple-design The parent-relative resident reopen signature remains with its owning native handle contract instead of a separate platform-specific consumer API.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The parent-relative resident reopen declaration introduces no fixture choice, foreign-method replacement or swallowed native failure.
   * @evidence contracts/common.md#meaningful-documentation The method prose states the parent-relative resident reopen operation's inputs, result and failure or release meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The parent-relative resident reopen signature specifies behavior but contains no executable algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The parent-relative resident reopen interface member implements no cross-call reuse or invalidation policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The parent-relative resident reopen declaration acquires no resource; the actual native adapter and publication coordinator own lifetime.
   */
  openResident(childName: string): IBoundChild;
}
