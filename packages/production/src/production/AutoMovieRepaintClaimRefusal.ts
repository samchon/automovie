import { AutoMovieRepaintClaimAdmission } from "./repaintAttemptClaim";

/**
 * Preserves non-acquired project admission statuses and safe admission-failed messages without recording a provider dispatch.
 *
 * @evidence contracts/common.md#principled-implementation Preserves non-acquired project admission statuses and safe admission-failed messages without recording a provider dispatch.
 * @evidence contracts/common.md#clear-and-simple-design The existing project admission union and execution-only safe failure arm keep reservation ownership with the project and stop reporting with the executor.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This structural shape introduces no runtime branch, provider substitution or fixture-specific behavior; runtime facts are admitted by its stated producer/consumer boundaries.
 * @evidence contracts/common.md#meaningful-documentation The object carries a cause and optional owner/message, not provider bytes or a reservation.
 * @evidence contracts/performance.md#efficient-algorithms The union is compile-time only; project claim readers and the executor validate runtime admission shapes.
 * @evidence contracts/performance.md#reuse-equivalent-work This erased shape shares the same admitted facts across its stated consumers; it creates no result cache or runtime equivalence/invalidation shortcut.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The object carries a cause and optional owner/message, not provider bytes or a reservation.
 */
export type AutoMovieRepaintClaimRefusal =
  | Exclude<AutoMovieRepaintClaimAdmission, { status: "acquired" }>
  | { status: "admission-failed"; message: string };
