/**
 * Display completion or connection retirement sent to the existing numerical
 * worker. Persistence cannot delay the model reply or start before display.
 *
 * @evidence contracts/common.md#principled-implementation Display completion permits a flush, while explicit retirement discards the producing request's staged preview.
 * @evidence contracts/common.md#clear-and-simple-design A flush-or-discard discriminator and optional request id contain the entire persistence control boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Persistence cannot be authorized by elapsed time or an unrelated later display generation.
 * @evidence contracts/common.md#meaningful-documentation Discard identifies its producing request; the single pending flush needs no request id and follows drawing.
 *
 * @author Samchon
 */
export interface IHumanViewerPersistenceCommand {
  /** Flush after drawing; discard withdraws one retired connection's result. */
  persistence: "flush" | "discard";

  /** Producing request when discarding; absent for the single pending flush. */
  id?: number;
}
