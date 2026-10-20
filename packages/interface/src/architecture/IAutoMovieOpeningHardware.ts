/**
 * One fixed member an opening carries, with no travel of its own.
 *
 * Hardware has no degree of freedom, so it is not part of the work-wide table
 * of driven elements, and its element is not required to sit under the
 * opening's fill. An element parented under a panel's element still rides that
 * panel's travel through the element hierarchy.
 *
 * Only `validateBuiltEnvironment` reads hardware today; lowering, drawings, and
 * schedules ignore it.
 *
 * @evidence contracts/common.md#principled-implementation `validateBuiltEnvironment` requires a unique non-blank id within the operation, a non-blank kind, and an element that is null or resolves; nothing enters the driven-element table, so a hardware element may also be driven by a panel or carriage.
 * @evidence contracts/common.md#clear-and-simple-design Three fields name a fixed part and optionally the element that draws it, leaving placement to the element hierarchy rather than adding a transform here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A declared-only part keeps a null element instead of pointing at a placeholder; the remaining gap is that no lowering, drawing, or schedule consumes hardware yet, which the documentation states.
 * @evidence contracts/common.md#meaningful-documentation States that hardware has no travel of its own, how it can still move with a parent panel, what a null element means, the label vocabulary, and that only validation reads it.
 */
export interface IAutoMovieOpeningHardware {
  /** Stable, non-blank hardware identity, unique within the opening. */
  id: string;

  /**
   * Non-blank open semantic label such as `frame`, `hinge`, `handle`, or
   * `track`.
   */
  kind: string;

  /** Visible element realizing it, or null when it is only declared. */
  element: string | null;
}
