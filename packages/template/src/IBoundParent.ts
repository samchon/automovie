import { type IBoundChild } from "./IBoundChild";
import { type IBoundParentStatus } from "./IBoundParentStatus";
import { type ICreateResult } from "./ICreateResult";

/**
 * A parent directory handle held for one publication.
 *
 * @evidence contracts/development/design.md#principled-representation A held directory authority supplies exclusive create and resident reopen relative to the same parent handle.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The platform-neutral contract lets publication order stay in one coordinator while POSIX and Windows own native opening.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts There is no absolute-child fallback, cleanup switch or fixture-dependent alternative in the parent contract.
 * @evidence contracts/development/common.md#meaningful-documentation Method comments state directory identity inspection, exclusive-slot outcomes and explicit parent and child release.
 */
export interface IBoundParent {
  /**
   * Release the held parent descriptor or HANDLE; native close failure throws.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The adapter closes the POSIX descriptor or Windows HANDLE it acquired; a failed close throws and cannot prove release of that authority.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The coordinator closes the parent after creation, verification or pre-create failure, keeping ordering with the operation that needs the held authority.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The parent descriptor release declaration introduces no fixture choice, foreign-method replacement or swallowed native failure.
   * @evidence contracts/development/common.md#meaningful-documentation The prose identifies the held parent as the released resource and states that native close failure throws.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The parent descriptor release signature specifies behavior but contains no executable algorithm.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The parent descriptor release interface member implements no cross-call reuse or invalidation policy.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The parent descriptor release declaration acquires no resource; the actual native adapter and publication coordinator own lifetime.
   */
  close(): void;

  /**
   * Reserve one absent child segment relative to this parent; report opened, clean refusal or a created slot without a usable handle.
   *
   * @evidence contracts/development/implementation.md#principled-implementation openat with O_CREAT|O_EXCL or NtCreateFile with FILE_CREATE reserves only an absent name relative to this held parent; the coordinator has validated childName as one non-empty segment without separators or NUL.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure ICreateResult separates refusal, usable child transfer and a reserved slot without a usable handle so the coordinator can classify irreversible file effects.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The exclusive child slot reservation declaration introduces no fixture choice, foreign-method replacement or swallowed native failure.
   * @evidence contracts/development/common.md#meaningful-documentation The prose states held-parent-relative reservation and distinguishes opened, refused and partial results; ICreateResult documents child-handle ownership and error provenance.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The exclusive child slot reservation signature specifies behavior but contains no executable algorithm.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The exclusive child slot reservation interface member implements no cross-call reuse or invalidation policy.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The exclusive child slot reservation declaration acquires no resource; the actual native adapter and publication coordinator own lifetime.
   */
  createExclusive(childName: string): ICreateResult;

  /**
   * Read whether the held parent is a directory and its physical identity without reopening its pathname.
   *
   * @evidence contracts/development/implementation.md#principled-implementation fstatSync or GetFileInformationByHandle reads the opened parent itself, so qualification and identity cannot come from a replacement at its pathname.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The two-field status lets openBoundParent compare directory qualification and captured identity before any exclusive child create.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The held parent directory inspection declaration introduces no fixture choice, foreign-method replacement or swallowed native failure.
   * @evidence contracts/development/common.md#meaningful-documentation The prose identifies held-handle provenance, the directory predicate and physical identity, and excludes a pathname reopen from that observation.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The held parent directory inspection signature specifies behavior but contains no executable algorithm.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The held parent directory inspection interface member implements no cross-call reuse or invalidation policy.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The held parent directory inspection declaration acquires no resource; the actual native adapter and publication coordinator own lifetime.
   */
  inspect(): IBoundParentStatus;

  /**
   * Reopen one existing child segment for read-only verification relative to this parent; native failure throws.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Read-only no-follow openat or NtCreateFile FILE_OPEN reopens the validated child segment under the same held parent without creating an absent name; POSIX refuses a final symlink during open, while Windows may return its reparse handle for the coordinator's ordinary-file status gate to reject.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resident verification receives the same IBoundChild status and close operations as the writer, with its own separately owned read-only handle.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The parent-relative resident reopen declaration introduces no fixture choice, foreign-method replacement or swallowed native failure.
   * @evidence contracts/development/common.md#meaningful-documentation The prose states the existing-child requirement, read-only verification purpose, held-parent provenance and thrown native failure.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The parent-relative resident reopen signature specifies behavior but contains no executable algorithm.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The parent-relative resident reopen interface member implements no cross-call reuse or invalidation policy.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The parent-relative resident reopen declaration acquires no resource; the actual native adapter and publication coordinator own lifetime.
   */
  openResident(childName: string): IBoundChild;
}
