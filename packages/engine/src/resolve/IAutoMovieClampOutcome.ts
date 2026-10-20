import { IAutoMovieClampViolation } from "./IAutoMovieClampViolation";

/**
 * The clamped value plus the list of bounds it crossed (empty if in range).
 *
 *
 * @evidence contracts/common.md#principled-implementation Return a component-wise clamped numeric vector and ordered records of crossed bounds; applyChannelLimit preserves input width and records min/max crossings under admitted limit shapes.
 * @evidence contracts/common.md#clear-and-simple-design One outcome separates the usable value from diagnostic evidence, letting resolution merge channels while reporting exact violations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An empty violation list means no admitted bound was crossed, not that arbitrary malformed values were validated; no fixture-specific tolerance is introduced.
 * @evidence contracts/common.md#meaningful-documentation Members identify output width, component/bound ordering and the caller-owned value/violation arrays.
 * @evidence contracts/performance.md#efficient-algorithms W components require O(W) result/diagnostic storage in the producer; this interface adds no evaluation or retained cache.
 * @evidence contracts/performance.md#reuse-equivalent-work The resolver uses the completed clamped value and violations together; altered value/limit inputs require a new outcome.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns both arrays and no channel buffer, graph handle or background task is retained by the type.
 */
export interface IAutoMovieClampOutcome {
  /** The value after clamping, same length as the input. */
  value: number[];

  /** Every component/bound that was exceeded, in component order. */
  violations: IAutoMovieClampViolation[];
}
