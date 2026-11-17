/**
 * One component of a channel value that exceeded its bound and was clamped.
 *
 *
 * @evidence contracts/development/design.md#principled-representation Record one crossed min/max bound with component index, admitted limit and original value, preserving diagnostic cause separately from the clamped result.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A fixed diagnostic row gives applyChannelLimit and resolveFrame enough information without retaining an entire channel or parsing prose.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Actual compared component values populate the row; no fixture id, guessed index or alternate threshold compensates for malformed input.
 * @evidence contracts/development/common.md#meaningful-documentation Members distinguish original actual value from chosen bound and its component address; units follow the owning channel property.
 */
export interface IAutoMovieClampViolation {
  /** Index of the offending component within the channel value vector. */
  component: number;

  /** Which bound was crossed. */
  bound: "min" | "max";

  /** The bound value the component was clamped to. */
  limit: number;

  /** The component's value before clamping. */
  actual: number;
}
