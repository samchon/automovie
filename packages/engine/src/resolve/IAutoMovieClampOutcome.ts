import { IAutoMovieClampViolation } from "./IAutoMovieClampViolation";

/**
 * The clamped value plus the list of bounds it crossed (empty if in range).
 *
 *
 * @evidence contracts/development/design.md#principled-representation Return a component-wise clamped numeric vector and ordered records of crossed bounds; applyChannelLimit preserves input width and records min/max crossings under admitted limit shapes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One outcome separates the usable value from diagnostic evidence, letting resolution merge channels while reporting exact violations.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An empty violation list means no admitted bound was crossed, not that arbitrary malformed values were validated; no fixture-specific tolerance is introduced.
 * @evidence contracts/development/common.md#meaningful-documentation Members identify output width, component/bound ordering and the caller-owned value/violation arrays.
 */
export interface IAutoMovieClampOutcome {
  /** The value after clamping, same length as the input. */
  value: number[];

  /** Every component/bound that was exceeded, in component order. */
  violations: IAutoMovieClampViolation[];
}
