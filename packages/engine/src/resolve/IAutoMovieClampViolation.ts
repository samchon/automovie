/**
 * One component of a channel value that exceeded its bound and was clamped.
 *
 *
 * @evidence contracts/common.md#principled-implementation Record one crossed min/max bound with component index, admitted limit and original value, preserving diagnostic cause separately from the clamped result.
 * @evidence contracts/common.md#clear-and-simple-design A fixed diagnostic row gives applyChannelLimit and resolveFrame enough information without retaining an entire channel or parsing prose.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Actual compared component values populate the row; no fixture id, guessed index or alternate threshold compensates for malformed input.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish original actual value from chosen bound and its component address; units follow the owning channel property.
 * @evidence contracts/performance.md#efficient-algorithms One violation is fixed-size scalar storage; aggregate rows grow with crossed components in the clamp producer.
 * @evidence contracts/performance.md#reuse-equivalent-work The same row is reused in frame diagnostics after clamping; the type owns no cross-request equality or cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only scalar facts are retained for the caller's reporting lifetime, with no value vector, node graph, handle or task owned.
 * @author Samchon
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
