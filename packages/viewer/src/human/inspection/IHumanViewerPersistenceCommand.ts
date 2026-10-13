/**
 * Display completion or connection retirement sent to the existing numerical
 * worker. Persistence cannot delay the model reply or start before display.
 *
 * @evidence contracts/common.md#principled-implementation Display completion permits a flush, while explicit retirement discards the producing request's staged preview.
 * @evidence contracts/common.md#clear-and-simple-design A flush-or-discard discriminator and optional request id contain the entire persistence control boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Persistence cannot be authorized by elapsed time or an unrelated later display generation.
 * @evidence contracts/common.md#meaningful-documentation Discard identifies its producing request; the single pending flush needs no request id and follows drawing.
 *
 * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Display completion permits a flush, while explicit retirement discards the producing request's staged preview.
 * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Persistence cannot be authorized by elapsed time or an unrelated later display generation.
 *
 * @author Samchon
 */
export interface IHumanViewerPersistenceCommand {
  /**
   * Flush after drawing; discard withdraws one retired connection's result.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Allows display-completed preview flushing or explicit request retirement discarding without delaying the model reply.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Allows display-completed preview flushing or explicit request retirement discarding without delaying the model reply.
   */
  persistence: "flush" | "discard";

  /**
   * Producing request when discarding; absent for the single pending flush.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Scopes discard to its producing numerical request, while the single pending flush needs no request id.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Scopes discard to its producing numerical request, while the single pending flush needs no request id.
   */
  id?: number;
}
